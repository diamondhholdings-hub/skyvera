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
   * Cache-aside pattern: Check cache, if miss call fetcher, store result, return
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
   * Manual set with TTL
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
   * Remove all keys matching glob pattern (e.g., 'metric:ARR:*')
   * Returns count of removed keys.
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
   * Get value with metadata for "last updated X minutes ago" display
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
   * Add ±10% random jitter to prevent thundering herd
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

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager()
  }
  return cacheManagerInstance
}
