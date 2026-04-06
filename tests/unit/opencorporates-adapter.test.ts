/**
 * Unit tests for OpenCorporatesAdapter
 *
 * Tests:
 *  1. Degraded mode (no API key) — connect() returns ok, query() returns ok with empty data
 *  2. Data transformation — API response shapes map correctly to CorporateRegistryData
 *  3. Search returning no results — returns ok with empty data
 *  4. Non-'customers' query type — returns err
 *  5. Missing customerName filter — returns err
 *  6. API HTTP error (non-429) propagated gracefully
 *  7. Rate-limit (429) returns ok with empty data
 *  8. Officers mapping — active vs. resigned officers
 *
 * All fetch calls are mocked — no real network requests are made.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OpenCorporatesAdapter } from '../../src/lib/data/adapters/external/opencorporates'
import type { CorporateRegistryData } from '../../src/lib/data/adapters/external/opencorporates'
import { getCacheManager } from '../../src/lib/cache/manager'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal OpenCorporates search response */
function makeSearchResponse(overrides: Partial<{
  companyNumber: string
  jurisdictionCode: string
  name: string
  currentStatus: string
  incorporationDate: string
  companyType: string
  registeredAddressInFull: string
}> = {}) {
  const o = {
    companyNumber: '07234321',
    jurisdictionCode: 'gb',
    name: 'Acme Ltd',
    currentStatus: 'Active',
    incorporationDate: '2010-06-01',
    companyType: 'Private Limited Company',
    registeredAddressInFull: '1 High Street, London, EC1A 1BB, United Kingdom',
    ...overrides,
  }

  return {
    results: {
      companies: [
        {
          company: {
            name: o.name,
            company_number: o.companyNumber,
            jurisdiction_code: o.jurisdictionCode,
            current_status: o.currentStatus,
            incorporation_date: o.incorporationDate,
            company_type: o.companyType,
            registered_address: { in_full: o.registeredAddressInFull },
          },
        },
      ],
    },
  }
}

/** Build a minimal company detail response */
function makeDetailResponse(overrides: Partial<{
  name: string
  currentStatus: string
  incorporationDate: string
  companyType: string
  registeredAddressInFull: string
  filingsCount: number
}> = {}) {
  const o = {
    name: 'Acme Ltd',
    currentStatus: 'Active',
    incorporationDate: '2010-06-01',
    companyType: 'Private Limited Company',
    registeredAddressInFull: '1 High Street, London, EC1A 1BB, United Kingdom',
    filingsCount: 42,
    ...overrides,
  }

  return {
    results: {
      company: {
        name: o.name,
        company_number: '07234321',
        jurisdiction_code: 'gb',
        current_status: o.currentStatus,
        incorporation_date: o.incorporationDate,
        company_type: o.companyType,
        registered_address: { in_full: o.registeredAddressInFull },
        filings_count: o.filingsCount,
      },
    },
  }
}

/** Build an officers response */
function makeOfficersResponse(officers: Array<{
  name: string
  role?: string
  startDate?: string
  endDate?: string
  inactive?: boolean
}>) {
  return {
    results: {
      officers: officers.map((o) => ({
        officer: {
          name: o.name,
          role: o.role ?? 'Director',
          start_date: o.startDate,
          end_date: o.endDate,
          inactive: o.inactive,
        },
      })),
    },
  }
}

// ---------------------------------------------------------------------------
// Mock fetch utility
// ---------------------------------------------------------------------------

/**
 * Replace global fetch with a function that cycles through `responses` in order.
 * Each entry maps to one fetch() call.
 */
function mockFetchSequence(responses: Array<{ ok: boolean; status?: number; body: unknown }>) {
  let callIndex = 0
  vi.stubGlobal('fetch', vi.fn(async () => {
    const r = responses[callIndex++]
    if (!r) throw new Error('mockFetchSequence: unexpected extra fetch call')
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 500),
      statusText: r.ok ? 'OK' : 'Error',
      json: async () => r.body,
    }
  }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OpenCorporatesAdapter', () => {
  let adapter: OpenCorporatesAdapter

  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    // Clear the shared in-process cache so each test starts with a clean slate
    getCacheManager().clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    getCacheManager().clear()
  })

  // ── Degraded mode ──────────────────────────────────────────────────────────

  describe('degraded mode (no API key)', () => {
    beforeEach(() => {
      vi.stubEnv('OPENCORPORATES_API_KEY', '')
      adapter = new OpenCorporatesAdapter()
    })

    it('connect() returns ok(undefined) — not an error', async () => {
      const result = await adapter.connect()
      expect(result.success).toBe(true)
    })

    it('healthCheck() returns true even when degraded', async () => {
      await adapter.connect()
      const healthy = await adapter.healthCheck()
      expect(healthy).toBe(true)
    })

    it('query() returns ok with empty data array — pipeline can continue', async () => {
      await adapter.connect()
      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.value.data).toEqual([])
      expect(result.value.count).toBe(0)
      expect(result.value.source).toBe('opencorporates')
    })

    it('query() does NOT call fetch when degraded', async () => {
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)

      await adapter.connect()
      await adapter.query({ type: 'customers', filters: { customerName: 'Acme Ltd' } })

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  // ── Input validation ───────────────────────────────────────────────────────

  describe('input validation', () => {
    beforeEach(async () => {
      vi.stubEnv('OPENCORPORATES_API_KEY', 'test-key-123')
      adapter = new OpenCorporatesAdapter()
      await adapter.connect()
    })

    it('returns err for unsupported query type', async () => {
      const result = await adapter.query({ type: 'news', filters: { customerName: 'Acme' } })
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error.message).toContain("only supports type 'customers'")
    })

    it('returns err when customerName filter is missing', async () => {
      const result = await adapter.query({ type: 'customers', filters: {} })
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error.message).toContain('requires filters.customerName')
    })
  })

  // ── Successful data transformation ────────────────────────────────────────

  describe('data transformation — happy path', () => {
    beforeEach(async () => {
      vi.stubEnv('OPENCORPORATES_API_KEY', 'test-key-123')
      adapter = new OpenCorporatesAdapter()
      await adapter.connect()
    })

    it('maps API response to CorporateRegistryData correctly', async () => {
      mockFetchSequence([
        { ok: true, body: makeSearchResponse() },
        { ok: true, body: makeDetailResponse({ filingsCount: 55 }) },
        {
          ok: true,
          body: makeOfficersResponse([
            { name: 'Jane Smith', role: 'Director', startDate: '2010-06-01' },
            { name: 'Bob Jones', role: 'Secretary', startDate: '2010-06-01', endDate: '2020-01-15' },
          ]),
        },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.value.count).toBe(1)
      expect(result.value.source).toBe('opencorporates')

      const data = result.value.data[0] as CorporateRegistryData
      expect(data.legalName).toBe('Acme Ltd')
      expect(data.jurisdiction).toBe('gb')
      expect(data.companyNumber).toBe('07234321')
      expect(data.status).toBe('active')
      expect(data.incorporationDate).toBe('2010-06-01')
      expect(data.companyType).toBe('Private Limited Company')
      expect(data.registeredAddress).toBe('1 High Street, London, EC1A 1BB, United Kingdom')
      expect(data.filingCount).toBe(55)
      expect(data.source).toBe('opencorporates')
      expect(data.enrichedAt).toBeTruthy()
    })

    it('sets status to "inactive" for dissolved companies', async () => {
      mockFetchSequence([
        { ok: true, body: makeSearchResponse({ currentStatus: 'Dissolved' }) },
        { ok: true, body: makeDetailResponse({ currentStatus: 'Dissolved', filingsCount: 10 }) },
        { ok: true, body: makeOfficersResponse([]) },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'OldCo Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      const data = result.value.data[0] as CorporateRegistryData
      expect(data.status).toBe('inactive')
    })

    it('sets status to "unknown" for unrecognised status strings', async () => {
      mockFetchSequence([
        { ok: true, body: makeSearchResponse({ currentStatus: 'Pending Registration' }) },
        {
          ok: true,
          body: makeDetailResponse({ currentStatus: 'Pending Registration', filingsCount: 0 }),
        },
        { ok: true, body: makeOfficersResponse([]) },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'NewCo Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      const data = result.value.data[0] as CorporateRegistryData
      expect(data.status).toBe('unknown')
    })
  })

  // ── Officers mapping ───────────────────────────────────────────────────────

  describe('officers mapping', () => {
    beforeEach(async () => {
      vi.stubEnv('OPENCORPORATES_API_KEY', 'test-key-123')
      adapter = new OpenCorporatesAdapter()
      await adapter.connect()
    })

    it('marks officers without end_date as active', async () => {
      mockFetchSequence([
        { ok: true, body: makeSearchResponse() },
        { ok: true, body: makeDetailResponse() },
        {
          ok: true,
          body: makeOfficersResponse([
            { name: 'Active Director', role: 'Director', startDate: '2015-01-01' },
          ]),
        },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      const data = result.value.data[0] as CorporateRegistryData
      expect(data.directors).toHaveLength(1)
      expect(data.directors[0].isActive).toBe(true)
      expect(data.directors[0].name).toBe('Active Director')
      expect(data.directors[0].role).toBe('Director')
      expect(data.directors[0].appointedOn).toBe('2015-01-01')
      expect(data.directors[0].resignedOn).toBeUndefined()
    })

    it('marks officers with end_date as inactive', async () => {
      mockFetchSequence([
        { ok: true, body: makeSearchResponse() },
        { ok: true, body: makeDetailResponse() },
        {
          ok: true,
          body: makeOfficersResponse([
            {
              name: 'Former Secretary',
              role: 'Secretary',
              startDate: '2010-06-01',
              endDate: '2019-12-31',
            },
          ]),
        },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      const data = result.value.data[0] as CorporateRegistryData
      expect(data.directors[0].isActive).toBe(false)
      expect(data.directors[0].resignedOn).toBe('2019-12-31')
    })

    it('filters out officers with no name', async () => {
      mockFetchSequence([
        { ok: true, body: makeSearchResponse() },
        { ok: true, body: makeDetailResponse() },
        {
          ok: true,
          body: {
            results: {
              officers: [
                { officer: { name: 'Valid Person', role: 'Director' } },
                { officer: { role: 'Director' } }, // no name — should be filtered
              ],
            },
          },
        },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      const data = result.value.data[0] as CorporateRegistryData
      expect(data.directors).toHaveLength(1)
      expect(data.directors[0].name).toBe('Valid Person')
    })
  })

  // ── Empty search results ───────────────────────────────────────────────────

  describe('search returns no results', () => {
    beforeEach(async () => {
      vi.stubEnv('OPENCORPORATES_API_KEY', 'test-key-123')
      adapter = new OpenCorporatesAdapter()
      await adapter.connect()
    })

    it('returns ok with empty data when company not found', async () => {
      mockFetchSequence([
        { ok: true, body: { results: { companies: [] } } },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Nonexistent Company XYZ' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.value.data).toEqual([])
      expect(result.value.count).toBe(0)
    })

    it('returns ok with empty data when search result is missing company_number', async () => {
      mockFetchSequence([
        {
          ok: true,
          body: {
            results: {
              companies: [{ company: { name: 'Partial Co' /* no company_number */ } }],
            },
          },
        },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Partial Co' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.value.data).toEqual([])
    })
  })

  // ── Error handling ─────────────────────────────────────────────────────────

  describe('error handling', () => {
    beforeEach(async () => {
      vi.stubEnv('OPENCORPORATES_API_KEY', 'test-key-123')
      adapter = new OpenCorporatesAdapter()
      await adapter.connect()
    })

    it('returns ok with empty data on 429 rate limit — does not throw', async () => {
      mockFetchSequence([
        { ok: false, status: 429, body: {} },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.value.data).toEqual([])
      expect(result.value.count).toBe(0)
    })

    it('returns ok with empty data on unexpected API error — does not throw', async () => {
      mockFetchSequence([
        { ok: false, status: 503, body: {} },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.value.data).toEqual([])
    })

    it('returns ok with partial data when officers call fails (detail succeeds)', async () => {
      mockFetchSequence([
        { ok: true, body: makeSearchResponse() },
        { ok: true, body: makeDetailResponse({ filingsCount: 7 }) },
        { ok: false, status: 500, body: {} }, // officers call fails
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      // Should succeed with empty directors rather than failing entirely
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.value.count).toBe(1)
      const data = result.value.data[0] as CorporateRegistryData
      expect(data.directors).toEqual([])
      expect(data.filingCount).toBe(7)
    })
  })

  // ── Registered address formatting ─────────────────────────────────────────

  describe('registered address formatting', () => {
    beforeEach(async () => {
      vi.stubEnv('OPENCORPORATES_API_KEY', 'test-key-123')
      adapter = new OpenCorporatesAdapter()
      await adapter.connect()
    })

    it('uses in_full when available', async () => {
      mockFetchSequence([
        { ok: true, body: makeSearchResponse({ registeredAddressInFull: '10 Downing St, London' }) },
        {
          ok: true,
          body: makeDetailResponse({ registeredAddressInFull: '10 Downing St, London' }),
        },
        { ok: true, body: makeOfficersResponse([]) },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      const data = result.value.data[0] as CorporateRegistryData
      expect(data.registeredAddress).toBe('10 Downing St, London')
    })

    it('builds address from parts when in_full is absent', async () => {
      const detailWithParts = {
        results: {
          company: {
            name: 'Acme Ltd',
            company_number: '07234321',
            jurisdiction_code: 'gb',
            current_status: 'Active',
            incorporation_date: '2010-06-01',
            company_type: 'Private Limited Company',
            registered_address: {
              street_address: '1 High Street',
              locality: 'London',
              postal_code: 'EC1A 1BB',
              country: 'United Kingdom',
              // no in_full
            },
            filings_count: 5,
          },
        },
      }

      mockFetchSequence([
        { ok: true, body: makeSearchResponse() },
        { ok: true, body: detailWithParts },
        { ok: true, body: makeOfficersResponse([]) },
      ])

      const result = await adapter.query({
        type: 'customers',
        filters: { customerName: 'Acme Ltd' },
      })

      expect(result.success).toBe(true)
      if (!result.success) return
      const data = result.value.data[0] as CorporateRegistryData
      expect(data.registeredAddress).toBe('1 High Street, London, EC1A 1BB, United Kingdom')
    })
  })
})
