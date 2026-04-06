/**
 * Unit tests for src/lib/middleware/rate-limit.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { rateLimit, rateLimitHeaders } from '../../src/lib/middleware/rate-limit'

// ---------------------------------------------------------------------------
// Minimal NextRequest stub
// ---------------------------------------------------------------------------

function makeRequest(ip?: string): Parameters<typeof rateLimit>[0] {
  const headers = new Headers()
  if (ip) headers.set('x-forwarded-for', ip)
  return { headers } as Parameters<typeof rateLimit>[0]
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

const _realDateNow = Date.now.bind(Date)

function fakeNow(offsetMs: number): void {
  Date.now = () => _realDateNow() + offsetMs
}

function resetTime(): void {
  Date.now = _realDateNow
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('rateLimit()', () => {
  beforeEach(() => resetTime())
  afterEach(() => resetTime())

  describe('basic allow/deny', () => {
    it('allows the first request', () => {
      const result = rateLimit(makeRequest('1.2.3.4'), { limit: 3, window: 60_000 })
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('allows requests up to the limit', () => {
      const req = makeRequest('10.0.0.1')
      const opts = { limit: 3, window: 60_000 }
      const r1 = rateLimit(req, opts)
      const r2 = rateLimit(req, opts)
      const r3 = rateLimit(req, opts)
      expect(r1.success).toBe(true)
      expect(r2.success).toBe(true)
      expect(r3.success).toBe(true)
      expect(r3.remaining).toBe(0)
    })

    it('blocks the request that exceeds the limit', () => {
      const req = makeRequest('10.0.0.2')
      const opts = { limit: 2, window: 60_000 }
      rateLimit(req, opts)
      rateLimit(req, opts)
      const blocked = rateLimit(req, opts)
      expect(blocked.success).toBe(false)
      expect(blocked.remaining).toBe(0)
      expect(blocked.reset).toBeGreaterThan(0)
    })
  })

  describe('window reset', () => {
    it('allows requests again after the window expires', () => {
      const req = makeRequest('10.0.0.3')
      const opts = { limit: 2, window: 1_000 }
      rateLimit(req, opts)
      rateLimit(req, opts)
      expect(rateLimit(req, opts).success).toBe(false)

      fakeNow(1_100)

      const allowed = rateLimit(req, opts)
      expect(allowed.success).toBe(true)
      expect(allowed.remaining).toBe(1)
    })
  })

  describe('per-IP isolation', () => {
    it('tracks different IPs independently', () => {
      const opts = { limit: 1, window: 60_000 }
      const reqA = makeRequest('192.168.1.1')
      const reqB = makeRequest('192.168.1.2')
      rateLimit(reqA, opts)
      expect(rateLimit(reqA, opts).success).toBe(false)
      expect(rateLimit(reqB, opts).success).toBe(true)
    })
  })

  describe('anonymous fallback', () => {
    it('uses shared bucket when no IP header is present', () => {
      const opts = { limit: 1, window: 60_000 }
      rateLimit(makeRequest(), opts)
      expect(rateLimit(makeRequest(), opts).success).toBe(false)
    })
  })

  describe('remaining counter', () => {
    it('decrements remaining with each request', () => {
      const req = makeRequest('10.1.1.1')
      const opts = { limit: 5, window: 60_000 }
      for (let i = 5; i >= 1; i--) {
        const result = rateLimit(req, opts)
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(i - 1)
      }
    })
  })

  describe('reset value', () => {
    it('returns reset in seconds when blocked', () => {
      const req = makeRequest('10.2.2.2')
      const opts = { limit: 1, window: 30_000 }
      rateLimit(req, opts)
      const blocked = rateLimit(req, opts)
      expect(blocked.success).toBe(false)
      expect(blocked.reset).toBeGreaterThanOrEqual(1)
      expect(blocked.reset).toBeLessThanOrEqual(30)
    })
  })
})

describe('rateLimitHeaders()', () => {
  it('returns correct headers for a successful result', () => {
    const headers = rateLimitHeaders({ success: true, remaining: 7, reset: 60 })
    expect(headers['X-RateLimit-Remaining']).toBe('7')
    expect(headers['Retry-After']).toBe('60')
  })

  it('returns 0 remaining and positive Retry-After when blocked', () => {
    const headers = rateLimitHeaders({ success: false, remaining: 0, reset: 45 })
    expect(headers['X-RateLimit-Remaining']).toBe('0')
    expect(headers['Retry-After']).toBe('45')
  })
})
