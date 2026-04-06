/**
 * Unit tests for SemanticResolver and financial metric definitions
 * Tests metric resolution, caching, unknown metrics, and METRIC_DEFINITIONS calculations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SemanticResolver } from '../../src/lib/semantic/resolver'
import { CacheManager } from '../../src/lib/cache/manager'
import {
  METRIC_DEFINITIONS,
  getMetricDefinition,
  getAllMetricDefinitions,
} from '../../src/lib/semantic/schema/financial'
import type { DataProvider } from '../../src/lib/semantic/resolver'
import type { FinancialData } from '../../src/lib/semantic/resolver'
import { ok, err } from '../../src/lib/types/result'
import type { BU } from '../../src/lib/types/financial'

// ── Mock DataProvider ─────────────────────────────────────────────────────────

function makeMockProvider(override?: Partial<FinancialData>): DataProvider {
  const financialData: FinancialData = {
    bu: 'Cloudsense',
    quarterlyRR: 8_000_000,
    currentRR: 8_000_000,
    priorRR: 8_336_000,   // reflects -$336k decline from CLAUDE.md
    nrr: 2_000_000,
    totalRevenue: 10_000_000,
    cogs: 2_100_000,      // 21% COGS
    opex: 1_700_000,      // 17% OpEx
    totalCosts: 3_800_000,
    customerCount: 85,
    ...override,
  }

  return {
    getFinancialData: vi.fn().mockResolvedValue(ok(financialData)),
    getCustomerData: vi.fn().mockResolvedValue(ok([])),
  }
}

// ── METRIC_DEFINITIONS — calculation functions ────────────────────────────────

describe('METRIC_DEFINITIONS calculations', () => {
  describe('ARR', () => {
    it('calculates ARR as quarterlyRR × 4', () => {
      const result = METRIC_DEFINITIONS.ARR.calculate({ quarterlyRR: 8_000_000 })
      expect(result).toBe(32_000_000)
    })

    it('throws when quarterlyRR is missing', () => {
      expect(() => METRIC_DEFINITIONS.ARR.calculate({})).toThrow('quarterlyRR is required')
    })

    it('ARR is zero when quarterlyRR is zero', () => {
      expect(METRIC_DEFINITIONS.ARR.calculate({ quarterlyRR: 0 })).toBe(0)
    })
  })

  describe('EBITDA', () => {
    it('calculates EBITDA as totalRevenue - cogs - opex', () => {
      const result = METRIC_DEFINITIONS.EBITDA.calculate({
        totalRevenue: 10_000_000,
        cogs: 2_100_000,
        opex: 1_700_000,
      })
      expect(result).toBe(6_200_000)
    })

    it('throws when any required field is missing', () => {
      expect(() =>
        METRIC_DEFINITIONS.EBITDA.calculate({ totalRevenue: 10_000_000, cogs: 2_000_000 })
      ).toThrow()
    })

    it('can produce negative EBITDA (loss scenario)', () => {
      const result = METRIC_DEFINITIONS.EBITDA.calculate({
        totalRevenue: 1_000_000,
        cogs: 800_000,
        opex: 500_000,
      })
      expect(result).toBeLessThan(0)
    })
  })

  describe('NetMargin', () => {
    it('calculates correct net margin percentage', () => {
      const result = METRIC_DEFINITIONS.NetMargin.calculate({
        totalRevenue: 10_000_000,
        totalCosts: 3_750_000,
      })
      expect(result).toBeCloseTo(62.5, 3)
    })

    it('returns 0 for zero revenue (no divide-by-zero)', () => {
      const result = METRIC_DEFINITIONS.NetMargin.calculate({
        totalRevenue: 0,
        totalCosts: 0,
      })
      expect(result).toBe(0)
    })

    it('throws when required fields are missing', () => {
      expect(() => METRIC_DEFINITIONS.NetMargin.calculate({ totalRevenue: 10_000_000 })).toThrow()
    })
  })

  describe('GrossMargin', () => {
    it('calculates gross margin correctly', () => {
      const result = METRIC_DEFINITIONS.GrossMargin.calculate({
        totalRevenue: 10_000_000,
        cogs: 2_100_000,
      })
      expect(result).toBeCloseTo(79, 0)
    })

    it('returns 0 for zero revenue', () => {
      expect(METRIC_DEFINITIONS.GrossMargin.calculate({ totalRevenue: 0, cogs: 0 })).toBe(0)
    })
  })

  describe('TotalRevenue', () => {
    it('sums rr + nrr', () => {
      expect(METRIC_DEFINITIONS.TotalRevenue.calculate({ rr: 12_600_000, nrr: 2_100_000 })).toBe(14_700_000)
    })

    it('throws when fields are missing', () => {
      expect(() => METRIC_DEFINITIONS.TotalRevenue.calculate({ rr: 5_000_000 })).toThrow()
    })
  })

  describe('RRDecline', () => {
    it('returns negative value when currentRR < priorRR (contraction)', () => {
      const result = METRIC_DEFINITIONS.RRDecline.calculate({
        currentRR: 12_264_000,
        priorRR: 12_600_000,
      })
      expect(result).toBeCloseTo(-336_000, 0)
    })

    it('returns positive value when revenue grows', () => {
      const result = METRIC_DEFINITIONS.RRDecline.calculate({
        currentRR: 13_000_000,
        priorRR: 12_600_000,
      })
      expect(result).toBeCloseTo(400_000, 0)
    })
  })
})

// ── getMetricDefinition helper ─────────────────────────────────────────────────

describe('getMetricDefinition', () => {
  it('returns a formatted string for a known metric', () => {
    const def = getMetricDefinition('ARR')
    expect(def).toContain('Annual Recurring Revenue')
    expect(def).toContain('Formula:')
    expect(def).toContain('Source:')
  })

  it('returns "Unknown metric" for an unrecognised name', () => {
    const def = getMetricDefinition('FooBarMetric')
    expect(def).toContain('Unknown metric')
  })
})

// ── getAllMetricDefinitions ────────────────────────────────────────────────────

describe('getAllMetricDefinitions', () => {
  it('includes all 6 defined metrics', () => {
    const all = getAllMetricDefinitions()
    ;['ARR', 'EBITDA', 'NetMargin', 'GrossMargin', 'TotalRevenue', 'RRDecline'].forEach((name) => {
      expect(all).toContain(name)
    })
  })

  it('returns a string starting with a heading', () => {
    expect(getAllMetricDefinitions()).toMatch(/^# Business Metrics Reference/)
  })
})

// ── SemanticResolver ──────────────────────────────────────────────────────────

describe('SemanticResolver', () => {
  let cache: CacheManager
  let resolver: SemanticResolver

  beforeEach(() => {
    cache = new CacheManager()
  })

  afterEach(() => {
    cache.dispose()
  })

  it('resolves ARR metric correctly via data provider', async () => {
    const provider = makeMockProvider({ quarterlyRR: 8_000_000 })
    resolver = new SemanticResolver(cache, provider)

    const result = await resolver.resolveMetric('ARR', { bu: 'Cloudsense' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value).toBeCloseTo(32_000_000, 0)
    }
  })

  it('returns error for unknown metric name', async () => {
    const provider = makeMockProvider()
    resolver = new SemanticResolver(cache, provider)

    const result = await resolver.resolveMetric('UnknownKPI', { bu: 'Cloudsense' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toContain('Unknown metric')
    }
  })

  it('returns error when data provider fails', async () => {
    const failingProvider: DataProvider = {
      getFinancialData: vi.fn().mockResolvedValue(err(new Error('DB connection failed'))),
      getCustomerData: vi.fn().mockResolvedValue(err(new Error('DB connection failed'))),
    }
    resolver = new SemanticResolver(cache, failingProvider)

    const result = await resolver.resolveMetric('ARR', { bu: 'Cloudsense' })

    expect(result.success).toBe(false)
  })

  it('caches result — fetcher called only once on repeated resolveMetric calls', async () => {
    const provider = makeMockProvider()
    resolver = new SemanticResolver(cache, provider)

    await resolver.resolveMetric('ARR', { bu: 'Cloudsense' })
    await resolver.resolveMetric('ARR', { bu: 'Cloudsense' })

    expect(provider.getFinancialData).toHaveBeenCalledTimes(1)
  })

  it('different BU keys use separate cache entries', async () => {
    const provider = makeMockProvider()
    resolver = new SemanticResolver(cache, provider)

    await resolver.resolveMetric('ARR', { bu: 'Cloudsense' })
    await resolver.resolveMetric('ARR', { bu: 'Kandy' })

    // Each BU is a distinct cache key → two fetches
    expect(provider.getFinancialData).toHaveBeenCalledTimes(2)
  })

  it('getMetricDefinitionsForPrompt includes heading', () => {
    resolver = new SemanticResolver(cache, makeMockProvider())
    const output = resolver.getMetricDefinitionsForPrompt()
    expect(output).toContain('# Available Business Metrics')
  })

  it('getMetricDefinitionsForPrompt filters to requested metrics only', () => {
    resolver = new SemanticResolver(cache, makeMockProvider())
    const output = resolver.getMetricDefinitionsForPrompt(['ARR', 'EBITDA'])
    expect(output).toContain('Annual Recurring Revenue')
    expect(output).toContain('EBITDA')
    // Should NOT contain unrelated metrics
    expect(output).not.toContain('Customer Count')
  })
})
