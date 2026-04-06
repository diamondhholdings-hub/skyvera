/**
 * Unit tests — RapidAPI degraded-mode behaviour
 *
 * Verifies that when RAPIDAPI_KEY is absent:
 *   1. Each adapter's connect() sets degraded=true but returns ok(undefined)
 *   2. Each adapter's query() returns ok({ data: [] }) — NOT err()
 *   3. The enrichment pipeline marks every section as 'skipped', not 'error'
 *
 * No real API calls are made. The enrichment pipeline test stubs
 * getConnectorFactory so no filesystem I/O occurs either.
 */

import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Top-level module mocks (hoisted by Vitest before any imports)
// ---------------------------------------------------------------------------

vi.mock('../../src/lib/data/registry/connector-factory.js', () => {
  const emptyOk = {
    success: true,
    value: { data: [], source: 'stub', timestamp: new Date(), count: 0 },
  }
  return {
    getConnectorFactory: vi.fn().mockResolvedValue({
      getData: vi.fn().mockResolvedValue(emptyOk),
    }),
  }
})

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })),
  mkdir: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/lib/data/server/account-plan-data.js', () => ({
  slugifyCustomerName: (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
}))

// ---------------------------------------------------------------------------
// Adapter imports (after mocks are declared)
// ---------------------------------------------------------------------------

import { RapidAPIEnrichmentAdapter } from '../../src/lib/data/adapters/rapidapi/enrichment.js'
import { RapidAPIFinancialIntelAdapter } from '../../src/lib/data/adapters/rapidapi/financial-intel.js'
import { HiringSignalsAdapter } from '../../src/lib/data/adapters/rapidapi/hiring-signals.js'
import { RapidAPINewsSentimentAdapter } from '../../src/lib/data/adapters/rapidapi/news-sentiment.js'
import { RiskCompetitiveAdapter } from '../../src/lib/data/adapters/rapidapi/risk-competitive.js'
import { enrichAccount } from '../../src/lib/data/server/enrichment-pipeline.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AnyQueryResult = Awaited<ReturnType<RapidAPIEnrichmentAdapter['query']>>

/** Verify a Result is ok() with an empty data array */
function assertEmptyOk(result: AnyQueryResult) {
  expect(result.success).toBe(true)
  if (!result.success) return // narrow for TS
  expect(result.value.data).toEqual([])
  expect(result.value.count).toBe(0)
}

// ---------------------------------------------------------------------------
// Shared setup: ensure RAPIDAPI_KEY is absent for all tests in this file
// ---------------------------------------------------------------------------

beforeEach(() => {
  delete process.env.RAPIDAPI_KEY
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Per-adapter degraded-mode tests
// ---------------------------------------------------------------------------

describe('RapidAPIEnrichmentAdapter — degraded mode (no RAPIDAPI_KEY)', () => {
  it('connect() returns ok(undefined) and sets degraded=true', async () => {
    const adapter = new RapidAPIEnrichmentAdapter()
    const result = await adapter.connect()
    expect(result.success).toBe(true)
    expect(await adapter.healthCheck()).toBe(false)
  })

  it('query() returns ok with empty data array instead of err', async () => {
    const adapter = new RapidAPIEnrichmentAdapter()
    await adapter.connect()
    const result = await adapter.query({
      type: 'customers',
      filters: { customerName: 'Acme Corp' },
    })
    assertEmptyOk(result)
  })
})

describe('RapidAPIFinancialIntelAdapter — degraded mode (no RAPIDAPI_KEY)', () => {
  it('connect() returns ok(undefined) and sets degraded=true', async () => {
    const adapter = new RapidAPIFinancialIntelAdapter()
    const result = await adapter.connect()
    expect(result.success).toBe(true)
    expect(await adapter.healthCheck()).toBe(false)
  })

  it('query() returns ok with empty data array instead of err', async () => {
    const adapter = new RapidAPIFinancialIntelAdapter()
    await adapter.connect()
    const result = await adapter.query({
      type: 'financials',
      filters: { customerName: 'Acme Corp' },
    })
    assertEmptyOk(result)
  })
})

describe('HiringSignalsAdapter — degraded mode (no RAPIDAPI_KEY)', () => {
  it('connect() returns ok(undefined) and sets degraded=true', async () => {
    const adapter = new HiringSignalsAdapter()
    const result = await adapter.connect()
    expect(result.success).toBe(true)
    expect(await adapter.healthCheck()).toBe(false)
  })

  it('query() returns ok with empty data array instead of err', async () => {
    const adapter = new HiringSignalsAdapter()
    await adapter.connect()
    const result = await adapter.query({
      type: 'customers',
      filters: { customerName: 'Acme Corp' },
    })
    assertEmptyOk(result)
  })
})

describe('RapidAPINewsSentimentAdapter — degraded mode (no RAPIDAPI_KEY)', () => {
  it('connect() returns ok(undefined) and sets degraded=true', async () => {
    const adapter = new RapidAPINewsSentimentAdapter()
    const result = await adapter.connect()
    expect(result.success).toBe(true)
    expect(await adapter.healthCheck()).toBe(false)
  })

  it('query() returns ok with empty data array instead of err', async () => {
    const adapter = new RapidAPINewsSentimentAdapter()
    await adapter.connect()
    const result = await adapter.query({
      type: 'news',
      filters: { customerName: 'Acme Corp' },
    })
    assertEmptyOk(result)
  })
})

describe('RiskCompetitiveAdapter — degraded mode (no RAPIDAPI_KEY)', () => {
  it('connect() returns ok(undefined) and sets degraded=true', async () => {
    const adapter = new RiskCompetitiveAdapter()
    const result = await adapter.connect()
    expect(result.success).toBe(true)
    expect(await adapter.healthCheck()).toBe(false)
  })

  it('query() returns ok with empty data array instead of err', async () => {
    const adapter = new RiskCompetitiveAdapter()
    await adapter.connect()
    const result = await adapter.query({
      type: 'customers',
      filters: { customerName: 'Acme Corp' },
    })
    assertEmptyOk(result)
  })
})

// ---------------------------------------------------------------------------
// Enrichment pipeline integration test (all adapters stubbed)
// ---------------------------------------------------------------------------

describe('enrichAccount() — pipeline marks sections as skipped when adapters return empty data', () => {
  it('all 5 sections get status=skipped (not error) when getData returns empty ok()', async () => {
    const result = await enrichAccount('Acme Corp')

    expect(result.success).toBe(true)
    if (!result.success) return

    const status = result.value.enrichmentStatus
    expect(status.company).toBe('skipped')
    expect(status.financials).toBe('skipped')
    expect(status.hiring).toBe('skipped')
    expect(status.risk).toBe('skipped')
    expect(status.news).toBe('skipped')
  })
})
