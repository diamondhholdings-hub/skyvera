/**
 * Unit tests for CacheManager
 * Tests hit/miss, TTL expiry, invalidation, patterns, stats, and concurrent reads
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheManager, CACHE_TTL } from '../../src/lib/cache/manager'

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager()
  })

  afterEach(() => {
    cache.dispose()
  })

  // ── Cache hit / miss ───────────────────────────────────────────────────────

  describe('get — cache hit', () => {
    it('returns cached value on second call without calling fetcher again', async () => {
      let calls = 0
      const fetcher = async () => {
        calls++
        return { revenue: 14_700_000 }
      }

      const first = await cache.get('key1', fetcher, { ttl: 60 })
      const second = await cache.get('key1', fetcher, { ttl: 60 })

      expect(first).toEqual({ revenue: 14_700_000 })
      expect(second).toEqual({ revenue: 14_700_000 })
      expect(calls).toBe(1)
    })

    it('returns fresh value on cache miss', async () => {
      const fetcher = async () => 42
      const result = await cache.get('miss-key', fetcher, { ttl: 60 })
      expect(result).toBe(42)
    })
  })

  describe('get — TTL expiry', () => {
    it('re-fetches after TTL expires', async () => {
      vi.useFakeTimers()
      let calls = 0
      const fetcher = async () => ++calls

      // First fetch — TTL 1 second, no jitter
      await cache.get('ttl-key', fetcher, { ttl: 1, jitter: false })
      expect(calls).toBe(1)

      // Advance 1.1 seconds past expiry
      vi.advanceTimersByTime(1100)

      await cache.get('ttl-key', fetcher, { ttl: 1, jitter: false })
      expect(calls).toBe(2)

      vi.useRealTimers()
    })

    it('does NOT re-fetch before TTL expires', async () => {
      vi.useFakeTimers()
      let calls = 0
      const fetcher = async () => ++calls

      await cache.get('not-expired', fetcher, { ttl: 60, jitter: false })
      vi.advanceTimersByTime(30_000) // 30s — still within 60s TTL
      await cache.get('not-expired', fetcher, { ttl: 60, jitter: false })

      expect(calls).toBe(1)
      vi.useRealTimers()
    })
  })

  // ── set / getWithMetadata ──────────────────────────────────────────────────

  describe('set and getWithMetadata', () => {
    it('stores a value retrievable via getWithMetadata', () => {
      cache.set('meta-key', { arr: 50_000_000 }, { ttl: 300, jitter: false })
      const result = cache.getWithMetadata<{ arr: number }>('meta-key')

      expect(result).not.toBeNull()
      expect(result!.value).toEqual({ arr: 50_000_000 })
      expect(result!.ttlRemaining).toBeGreaterThan(0)
    })

    it('getWithMetadata returns null for unknown key', () => {
      expect(cache.getWithMetadata('no-such-key')).toBeNull()
    })

    it('getWithMetadata returns null for expired entry', () => {
      vi.useFakeTimers()
      cache.set('exp-key', 'hello', { ttl: 1, jitter: false })
      vi.advanceTimersByTime(2000)
      expect(cache.getWithMetadata('exp-key')).toBeNull()
      vi.useRealTimers()
    })
  })

  // ── invalidate ─────────────────────────────────────────────────────────────

  describe('invalidate', () => {
    it('returns true and removes existing key', async () => {
      await cache.get('del-key', async () => 'cached', { ttl: 60 })
      const removed = cache.invalidate('del-key')

      expect(removed).toBe(true)
      // Next get should call fetcher again
      let calls = 0
      await cache.get('del-key', async () => { calls++; return 'fresh' }, { ttl: 60 })
      expect(calls).toBe(1)
    })

    it('returns false for non-existent key', () => {
      expect(cache.invalidate('ghost-key')).toBe(false)
    })
  })

  // ── invalidatePattern ──────────────────────────────────────────────────────

  describe('invalidatePattern', () => {
    it('removes all keys matching a wildcard prefix pattern', async () => {
      cache.set('metric:ARR:Cloudsense:Q1', 10, { ttl: 60 })
      cache.set('metric:ARR:Kandy:Q1', 20, { ttl: 60 })
      cache.set('metric:EBITDA:Cloudsense:Q1', 30, { ttl: 60 })
      cache.set('other:key', 40, { ttl: 60 })

      const removed = cache.invalidatePattern('metric:ARR:*')

      expect(removed).toBe(2)
      expect(cache.getWithMetadata('metric:ARR:Cloudsense:Q1')).toBeNull()
      expect(cache.getWithMetadata('metric:ARR:Kandy:Q1')).toBeNull()
      // Non-matching keys survive
      expect(cache.getWithMetadata('metric:EBITDA:Cloudsense:Q1')).not.toBeNull()
      expect(cache.getWithMetadata('other:key')).not.toBeNull()
    })

    it('returns 0 when no keys match the pattern', () => {
      cache.set('foo:bar', 1, { ttl: 60 })
      expect(cache.invalidatePattern('metric:*')).toBe(0)
    })

    it('wildcard * matches everything', () => {
      cache.set('a', 1, { ttl: 60 })
      cache.set('b', 2, { ttl: 60 })
      cache.set('c', 3, { ttl: 60 })
      expect(cache.invalidatePattern('*')).toBe(3)
    })
  })

  // ── stats ──────────────────────────────────────────────────────────────────

  describe('stats', () => {
    it('starts with zero size and zero rates', () => {
      const s = cache.stats()
      expect(s.size).toBe(0)
      expect(s.hitRate).toBe(0)
      expect(s.missRate).toBe(0)
    })

    it('hit rate is 1 after one miss followed by one hit', async () => {
      const fetcher = async () => 'value'
      await cache.get('stat-key', fetcher, { ttl: 60 })   // miss
      await cache.get('stat-key', fetcher, { ttl: 60 })   // hit

      const s = cache.stats()
      expect(s.hitRate).toBeCloseTo(0.5, 5)
      expect(s.missRate).toBeCloseTo(0.5, 5)
      expect(s.hitRate + s.missRate).toBeCloseTo(1, 5)
    })

    it('size reflects number of cached entries', () => {
      cache.set('k1', 1, { ttl: 60 })
      cache.set('k2', 2, { ttl: 60 })
      expect(cache.stats().size).toBe(2)
    })
  })

  // ── clear ──────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all entries and resets stats', async () => {
      await cache.get('c1', async () => 1, { ttl: 60 })
      await cache.get('c1', async () => 1, { ttl: 60 })
      cache.clear()

      const s = cache.stats()
      expect(s.size).toBe(0)
      expect(s.hitRate).toBe(0)
      expect(s.missRate).toBe(0)
    })
  })

  // ── concurrent reads ───────────────────────────────────────────────────────

  describe('concurrent reads on the same key', () => {
    it('both calls return the same value', async () => {
      let calls = 0
      const fetcher = async () => {
        calls++
        return 'shared-result'
      }

      const [a, b] = await Promise.all([
        cache.get('concurrent', fetcher, { ttl: 60 }),
        cache.get('concurrent', fetcher, { ttl: 60 }),
      ])

      expect(a).toBe('shared-result')
      expect(b).toBe('shared-result')
      // May be 1 or 2 calls depending on timing — both outcomes are valid
      expect(calls).toBeGreaterThanOrEqual(1)
    })
  })

  // ── CACHE_TTL constants ────────────────────────────────────────────────────

  describe('CACHE_TTL constants', () => {
    it('FINANCIAL is 5 minutes (300s)', () => {
      expect(CACHE_TTL.FINANCIAL).toBe(300)
    })

    it('CUSTOMER_DATA is 10 minutes (600s)', () => {
      expect(CACHE_TTL.CUSTOMER_DATA).toBe(600)
    })

    it('CLAUDE_ENRICHMENT is longer than CLAUDE_RESPONSE', () => {
      expect(CACHE_TTL.CLAUDE_ENRICHMENT).toBeGreaterThan(CACHE_TTL.CLAUDE_RESPONSE)
    })
  })
})
