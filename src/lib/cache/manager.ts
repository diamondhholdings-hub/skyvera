/**
 * CacheManager - In-memory cache with TTL, jitter, and pattern invalidation
 * Implements cache-aside pattern with graceful degradation
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number // Unix timestamp ms
  createdAt: number
}

export interface CacheOptions {
  ttl: number // Base TTL in seconds
  jitter?: boolean // Add ±10% jitter to TTL (default true)
}

export const CACHE_TTL = {
  FINANCIAL: 300, // 5 minutes for financial data (changes quarterly)
  NEWS: 900, // 15 minutes for news intelligence
  CLAUDE_RESPONSE: 300, // 5 minutes for Claude responses (user queries)
  CLAUDE_ENRICHMENT: 900, // 15 minutes for background enrichment
  CUSTOMER_DATA: 600, // 10 minutes for customer records
} as const

// DEMO_MODE: Extended cache TTLs for demo stability (30min dashboard, 60min intelligence)
const DEMO_MODE = process.env.DEMO_MODE === 'true'

export const DEMO_CACHE_TTL = {
  FINANCIAL: 1800, // 30 minutes (was 5min)
  NEWS: 3600, // 60 minutes (was 15min)
  CLAUDE_RESPONSE: 1800, // 30 minutes (was 5min)
  CLAUDE_ENRICHMENT: 3600, // 60 minutes (was 15min)
  CUSTOMER_DATA: 1800, // 30 minutes (was 10min)
} as const

/**
 * Return the TTL constants appropriate for the current environment.
 *
 * When `DEMO_MODE=true`, all TTLs are extended (5–30 min → 30–60 min) to prevent
 * live API calls from disrupting a demonstration. Set this flag in `.env.local`
 * or as a Vercel environment variable for demo deployments.
 *
 * @returns Either `CACHE_TTL` (production) or `DEMO_CACHE_TTL` (demo mode)
 */
export function getActiveTTL() {
  return DEMO_MODE ? DEMO_CACHE_TTL : CACHE_TTL
}

export class CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private hits = 0
  private misses = 0
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Run periodic cleanup of expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Cache-aside read: return a cached value if fresh, otherwise call `fetcher`,
   * store the result, and return it.
   *
   * Failures in both the cache read and cache write are caught and logged rather
   * than thrown, so a broken cache never prevents data from reaching the caller.
   *
   * @param key      Cache key, e.g. `'metric:ARR:Cloudsense:Q1'`
   * @param fetcher  Async function to call on a cache miss
   * @param options  TTL and optional jitter configuration
   * @returns        Cached or freshly fetched value of type T
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined

      if (entry && entry.expiresAt > Date.now()) {
        this.hits++
        return entry.value
      }

      // Cache miss or expired
      this.misses++
    } catch (error) {
      // Graceful degradation: if cache read fails, just fetch fresh
      console.warn(`Cache read failed for key ${key}:`, error)
    }

    // Fetch fresh data
    const value = await fetcher()

    // Try to cache it (graceful degradation if this fails)
    try {
      this.set(key, value, options)
    } catch (error) {
      console.warn(`Cache write failed for key ${key}:`, error)
    }

    return value
  }

  /**
   * Store a value with a TTL. Jitter is applied by default (±10%) to prevent
   * cache stampedes when many keys are written with the same TTL.
   *
   * @param key     Cache key
   * @param value   Value to store
   * @param options TTL in seconds; set `jitter: false` for deterministic expiry
   */
  set<T>(key: string, value: T, options: CacheOptions): void {
    const baseTTLMs = options.ttl * 1000
    const ttlMs = options.jitter !== false ? this.addJitter(baseTTLMs) : baseTTLMs
    const now = Date.now()

    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + ttlMs,
      createdAt: now,
    }

    this.cache.set(key, entry as CacheEntry<unknown>)
  }

  /**
   * Remove single key. Returns true if key existed.
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Remove all cache entries whose keys match a glob pattern.
   *
   * Supports `*` as a wildcard (maps to `.*` in regex). Other regex special
   * characters are escaped, so dots and brackets in key names are treated literally.
   *
   * Useful for bulk invalidation after a data refresh, e.g.:
   * - `invalidatePattern('metric:*')` — clear all computed metrics
   * - `invalidatePattern('customer:Kandy:*')` — clear all Kandy account caches
   *
   * @param pattern  Glob-style pattern string
   * @returns        Number of keys removed
   */
  invalidatePattern(pattern: string): number {
    let count = 0
    const regex = this.patternToRegex(pattern)

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * Retrieve a cached value along with its timestamp metadata.
   *
   * Used by the orchestrator and UI components that display "last enriched X min ago"
   * badges. Returns `null` for both missing keys and expired entries so callers
   * can treat both cases uniformly without checking expiry separately.
   *
   * @param key  Cache key to look up
   * @returns    Object with value, createdAt, expiresAt, and ttlRemaining (ms); or null
   */
  getWithMetadata<T>(key: string): {
    value: T
    createdAt: Date
    expiresAt: Date
    ttlRemaining: number
  } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry || entry.expiresAt <= Date.now()) {
      return null
    }

    return {
      value: entry.value,
      createdAt: new Date(entry.createdAt),
      expiresAt: new Date(entry.expiresAt),
      ttlRemaining: Math.max(0, entry.expiresAt - Date.now()),
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; hitRate: number; missRate: number } {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
    }
  }

  /**
   * Clean shutdown
   */
  dispose(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }

  /**
   * Add ±10% random jitter to a TTL to spread cache expirations.
   *
   * Without jitter, all entries written with the same TTL expire simultaneously,
   * causing a "thundering herd" where every caller fires a fetcher at once.
   * A ±10% random offset desynchronises expiry times across hot keys.
   *
   * @param baseTTLMs  Base TTL in milliseconds
   * @returns          Jittered TTL in milliseconds (baseTTL ± up to 10%)
   */
  private addJitter(baseTTLMs: number): number {
    const jitterPercent = 0.1
    const jitter = baseTTLMs * jitterPercent * (Math.random() * 2 - 1)
    return baseTTLMs + jitter
  }

  /**
   * Convert glob pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    // Simple glob: * matches any characters
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
    return new RegExp(`^${escaped}$`)
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null

/**
 * Return the process-level CacheManager singleton.
 *
 * Creates the instance on first call; subsequent calls return the same object.
 * In Next.js, each worker process gets its own singleton — there is no shared
 * cache across serverless function instances. For multi-instance consistency
 * consider migrating to Redis/Upstash (tracked in tech debt).
 *
 * @returns The shared CacheManager instance for this process
 */
export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager()
  }
  return cacheManagerInstance
}
