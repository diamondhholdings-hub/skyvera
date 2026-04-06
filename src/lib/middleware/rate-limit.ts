/**
 * In-memory sliding-window rate limiter for Next.js App Router API routes.
 *
 * Keyed by client IP (extracted from standard forwarded headers).
 * Falls back to 'anonymous' when no IP is determinable.
 *
 * Usage:
 *   const result = await rateLimit(request, { limit: 10, window: 60_000 })
 *   if (!result.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests', retryAfter: result.reset },
 *       { status: 429, headers: { 'Retry-After': String(result.reset) } }
 *     )
 *   }
 */

import { NextRequest } from 'next/server'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number
  /** Sliding window duration in milliseconds */
  window: number
}

export interface RateLimitResult {
  success: boolean
  /** Requests remaining in the current window */
  remaining: number
  /** Seconds until the oldest request in the window expires */
  reset: number
}

// --------------------------------------------------------------------------
// Internal store — one Map per (key + window) combination
// Each entry is a sorted list of timestamps (ms) for requests in the window
// --------------------------------------------------------------------------

const store = new Map<string, number[]>()

// Prune the store on a lazy schedule to avoid unbounded growth.
// We prune entries whose entire timestamp list has expired.
let lastPrune = Date.now()
const PRUNE_INTERVAL_MS = 5 * 60 * 1000 // every 5 minutes

function maybePrune(windowMs: number): void {
  const now = Date.now()
  if (now - lastPrune < PRUNE_INTERVAL_MS) return
  lastPrune = now
  for (const [key, timestamps] of store.entries()) {
    const cutoff = now - windowMs
    const valid = timestamps.filter((t) => t > cutoff)
    if (valid.length === 0) {
      store.delete(key)
    } else {
      store.set(key, valid)
    }
  }
}

// --------------------------------------------------------------------------
// IP extraction
// --------------------------------------------------------------------------

function getClientIp(request: NextRequest): string {
  // Vercel sets x-forwarded-for; fallback chain for other environments
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // May be comma-separated list; take the first (originating client)
    const first = forwarded.split(',')[0].trim()
    if (first) return first
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  // Next.js 16 exposes request.ip on some runtimes
  const reqIp = (request as NextRequest & { ip?: string }).ip
  if (reqIp) return reqIp

  return 'anonymous'
}

// --------------------------------------------------------------------------
// Core rate-limit function
// --------------------------------------------------------------------------

/**
 * Check and record a request against the rate limit for the given request.
 * The store key is `${ip}:${limit}:${window}` so different configs on the
 * same route are isolated from one another.
 */
export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, window: windowMs } = options
  const ip = getClientIp(request)
  const key = `${ip}:${limit}:${windowMs}`
  const now = Date.now()
  const cutoff = now - windowMs

  maybePrune(windowMs)

  // Retrieve existing timestamps, drop those outside the current window
  const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff)

  if (timestamps.length >= limit) {
    // Oldest timestamp in window tells us when a slot opens up
    const oldestInWindow = timestamps[0]
    const resetSeconds = Math.ceil((oldestInWindow + windowMs - now) / 1000)
    return {
      success: false,
      remaining: 0,
      reset: resetSeconds > 0 ? resetSeconds : 1,
    }
  }

  // Allow: record this request
  timestamps.push(now)
  store.set(key, timestamps)

  const resetSeconds = Math.ceil(windowMs / 1000)
  return {
    success: true,
    remaining: limit - timestamps.length,
    reset: resetSeconds,
  }
}

// --------------------------------------------------------------------------
// Convenience: build the standard 429 response headers
// --------------------------------------------------------------------------

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'Retry-After': String(result.reset),
  }
}
