/**
 * OpenCorporatesAdapter - integrates with OpenCorporates for official company registry data
 * Provides: legal name, jurisdiction, incorporation date, company status, directors/officers,
 * registered address, company type, and filing count.
 *
 * Caches aggressively — corporate registry data changes rarely (annual filings).
 *
 * API base: https://api.opencorporates.com/v0.4
 * Endpoints used:
 *   - GET /companies/search?q={name}&api_token={key}&per_page=1
 *   - GET /companies/{jurisdiction}/{company_number}?api_token={key}
 *   - GET /companies/{jurisdiction}/{company_number}/officers?api_token={key}
 */

import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager, CACHE_TTL } from '@/lib/cache/manager'

// ---------------------------------------------------------------------------
// Public type — exported and re-exported via enrichment.ts
// ---------------------------------------------------------------------------

export interface CorporateRegistryData {
  legalName: string
  jurisdiction: string // ISO country code, e.g. "gb"
  companyNumber: string
  incorporationDate?: string // ISO date, e.g. "2005-03-14"
  dissolutionDate?: string
  companyType?: string // e.g. "Private Limited Company"
  status: 'active' | 'inactive' | 'unknown'
  registeredAddress?: string
  directors: Array<{
    name: string
    role?: string // e.g. "Director", "Secretary"
    appointedOn?: string
    resignedOn?: string
    isActive: boolean
  }>
  filingCount?: number
  source: 'opencorporates'
  enrichedAt: string // ISO timestamp
}

// ---------------------------------------------------------------------------
// Internal OpenCorporates API response shapes
// ---------------------------------------------------------------------------

interface OCSearchResult {
  company?: {
    name?: string
    company_number?: string
    jurisdiction_code?: string
    incorporation_date?: string
    dissolution_date?: string
    company_type?: string
    current_status?: string
    registered_address?: {
      street_address?: string
      locality?: string
      region?: string
      postal_code?: string
      country?: string
      in_full?: string
    }
    number_of_employees?: number
    // opencorporates returns filings_count on company detail, not search
    filings_count?: number
  }
}

interface OCSearchResponse {
  results?: {
    companies?: OCSearchResult[]
    total_count?: number
    page?: number
    per_page?: number
  }
  api_version?: string
  error?: string
}

interface OCCompanyDetailResponse {
  results?: {
    company?: {
      name?: string
      company_number?: string
      jurisdiction_code?: string
      incorporation_date?: string
      dissolution_date?: string
      company_type?: string
      current_status?: string
      registered_address?: {
        street_address?: string
        locality?: string
        region?: string
        postal_code?: string
        country?: string
        in_full?: string
      }
      filings_count?: number
    }
  }
  error?: string
}

interface OCOfficer {
  officer?: {
    name?: string
    role?: string
    start_date?: string
    end_date?: string
    // inactive if end_date is set
    inactive?: boolean
    occupation?: string
    position?: string
  }
}

interface OCOfficersResponse {
  results?: {
    officers?: OCOfficer[]
  }
  error?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a registered address object into a single human-readable string.
 * Uses the `in_full` field when available, otherwise builds from parts.
 */
function formatRegisteredAddress(
  addr:
    | {
        street_address?: string
        locality?: string
        region?: string
        postal_code?: string
        country?: string
        in_full?: string
      }
    | undefined
): string | undefined {
  if (!addr) return undefined
  if (addr.in_full) return addr.in_full

  const parts = [
    addr.street_address,
    addr.locality,
    addr.region,
    addr.postal_code,
    addr.country,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : undefined
}

/**
 * Map OpenCorporates current_status to our three-value union.
 * OC uses freeform strings like "Active", "Dissolved", "Inactive", etc.
 */
function normaliseStatus(raw: string | undefined): 'active' | 'inactive' | 'unknown' {
  if (!raw) return 'unknown'
  const lower = raw.toLowerCase()
  if (lower === 'active' || lower === 'live') return 'active'
  if (
    lower === 'dissolved' ||
    lower === 'inactive' ||
    lower === 'closed' ||
    lower === 'liquidation' ||
    lower === 'struck off'
  )
    return 'inactive'
  return 'unknown'
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class OpenCorporatesAdapter implements DataAdapter {
  name = 'opencorporates'

  private apiKey: string | undefined
  private baseUrl = 'https://api.opencorporates.com/v0.4'
  private cache = getCacheManager()
  private degraded = false // True when OPENCORPORATES_API_KEY is missing

  constructor() {
    this.apiKey = process.env.OPENCORPORATES_API_KEY
  }

  // -------------------------------------------------------------------------
  // DataAdapter lifecycle
  // -------------------------------------------------------------------------

  async connect(): Promise<Result<void, Error>> {
    if (!this.apiKey) {
      console.warn(
        '[OpenCorporatesAdapter] OPENCORPORATES_API_KEY not configured - adapter running in degraded mode'
      )
      this.degraded = true
      return ok(undefined) // Not a failure, just degraded
    }

    console.log('[OpenCorporatesAdapter] Connected successfully')
    this.degraded = false
    return ok(undefined)
  }

  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    if (query.type !== 'customers') {
      return err(
        new Error(
          `OpenCorporates adapter only supports type 'customers', got '${query.type}'`
        )
      )
    }

    if (!query.filters?.customerName) {
      return err(new Error('OpenCorporates query requires filters.customerName'))
    }

    if (this.degraded) {
      // Return empty data — not an error — so the pipeline can still write a complete file
      return ok({
        data: [],
        source: this.name,
        timestamp: new Date(),
        count: 0,
      })
    }

    const companyName = query.filters.customerName
    const cacheKey = `opencorporates:${companyName.toLowerCase().replace(/\s+/g, '-')}`

    try {
      const registryData = await this.cache.get(
        cacheKey,
        async () => {
          return await this.fetchCorporateData(companyName)
        },
        { ttl: CACHE_TTL.CUSTOMER_DATA, jitter: true } // 10 min in-process; disk cache is permanent
      )

      if (!registryData) {
        return ok({
          data: [],
          source: this.name,
          timestamp: new Date(),
          count: 0,
        })
      }

      return ok({
        data: [registryData],
        source: this.name,
        timestamp: new Date(),
        count: 1,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'

      if (msg.includes('429')) {
        // Rate limit — return empty data gracefully so pipeline continues
        console.warn(
          '[OpenCorporatesAdapter] Rate limit hit (429) — returning empty data gracefully'
        )
        return ok({
          data: [],
          source: this.name,
          timestamp: new Date(),
          count: 0,
        })
      }

      if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT')) {
        console.warn('[OpenCorporatesAdapter] Network error — returning empty data gracefully')
        return ok({
          data: [],
          source: this.name,
          timestamp: new Date(),
          count: 0,
        })
      }

      // Unknown error — log and return empty gracefully
      console.error(`[OpenCorporatesAdapter] Unexpected error for "${companyName}":`, error)
      return ok({
        data: [],
        source: this.name,
        timestamp: new Date(),
        count: 0,
      })
    }
  }

  async healthCheck(): Promise<boolean> {
    // Degraded is still "healthy" — just no API key configured
    return true
  }

  async disconnect(): Promise<void> {
    console.log('[OpenCorporatesAdapter] Disconnected')
  }

  // -------------------------------------------------------------------------
  // Fetch orchestration: search → company detail → officers
  // -------------------------------------------------------------------------

  /**
   * Fetch registry data for a company name.
   * Step 1: Search for the company to get jurisdiction + company_number.
   * Step 2: Fetch full company detail (includes filings_count).
   * Step 3: Fetch officers list in parallel with step 2.
   * Returns null if the company cannot be found.
   */
  private async fetchCorporateData(companyName: string): Promise<CorporateRegistryData | null> {
    console.log(`[OpenCorporatesAdapter] Searching for "${companyName}"`)

    // Step 1: Search
    const searchResult = await this.searchCompany(companyName)
    if (!searchResult) {
      console.warn(`[OpenCorporatesAdapter] No results found for "${companyName}"`)
      return null
    }

    const { jurisdiction, companyNumber } = searchResult

    // Steps 2 + 3: detail and officers in parallel
    const [detailResult, officersResult] = await Promise.allSettled([
      this.fetchCompanyDetail(jurisdiction, companyNumber),
      this.fetchOfficers(jurisdiction, companyNumber),
    ])

    const detail = detailResult.status === 'fulfilled' ? detailResult.value : null
    const officers = officersResult.status === 'fulfilled' ? officersResult.value : []

    if (detailResult.status === 'rejected') {
      console.warn(
        `[OpenCorporatesAdapter] Company detail fetch failed for ${jurisdiction}/${companyNumber}:`,
        detailResult.reason
      )
    }
    if (officersResult.status === 'rejected') {
      console.warn(
        `[OpenCorporatesAdapter] Officers fetch failed for ${jurisdiction}/${companyNumber}:`,
        officersResult.reason
      )
    }

    // Merge: prefer detail over search data where available
    const company = detail ?? searchResult.rawCompany

    const registryData: CorporateRegistryData = {
      legalName: company.name ?? companyName,
      jurisdiction,
      companyNumber,
      incorporationDate: company.incorporationDate,
      dissolutionDate: company.dissolutionDate,
      companyType: company.companyType,
      status: normaliseStatus(company.currentStatus),
      registeredAddress: company.registeredAddress,
      directors: officers,
      filingCount: company.filingCount,
      source: 'opencorporates',
      enrichedAt: new Date().toISOString(),
    }

    console.log(
      `[OpenCorporatesAdapter] Enriched "${companyName}" — ` +
        `${jurisdiction}/${companyNumber}, status=${registryData.status}, ` +
        `directors=${officers.length}`
    )

    return registryData
  }

  // -------------------------------------------------------------------------
  // Step 1: Search
  // -------------------------------------------------------------------------

  /**
   * Search for the first matching company and return its jurisdiction + number.
   * Also returns the raw company data from the search result as a fallback
   * in case the full company detail call fails.
   */
  private async searchCompany(companyName: string): Promise<{
    jurisdiction: string
    companyNumber: string
    rawCompany: {
      name?: string
      incorporationDate?: string
      dissolutionDate?: string
      companyType?: string
      currentStatus?: string
      registeredAddress?: string
      filingCount?: number
    }
  } | null> {
    const url =
      `${this.baseUrl}/companies/search` +
      `?q=${encodeURIComponent(companyName)}` +
      `&api_token=${encodeURIComponent(this.apiKey!)}` +
      `&per_page=1`

    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 OpenCorporates rate limit exceeded')
      throw new Error(`OpenCorporates search HTTP ${response.status}: ${response.statusText}`)
    }

    const data: OCSearchResponse = await response.json()

    if (data.error) {
      throw new Error(`OpenCorporates API error: ${data.error}`)
    }

    const companies = data.results?.companies
    if (!companies || companies.length === 0) {
      return null
    }

    const first = companies[0]?.company
    if (!first?.company_number || !first?.jurisdiction_code) {
      return null
    }

    return {
      jurisdiction: first.jurisdiction_code,
      companyNumber: first.company_number,
      rawCompany: {
        name: first.name,
        incorporationDate: first.incorporation_date,
        dissolutionDate: first.dissolution_date,
        companyType: first.company_type,
        currentStatus: first.current_status,
        registeredAddress: formatRegisteredAddress(first.registered_address),
        filingCount: first.filings_count,
      },
    }
  }

  // -------------------------------------------------------------------------
  // Step 2: Company detail
  // -------------------------------------------------------------------------

  /**
   * Fetch full company detail from the entity endpoint.
   * This gives us filings_count and the most complete registered_address.
   */
  private async fetchCompanyDetail(
    jurisdiction: string,
    companyNumber: string
  ): Promise<{
    name?: string
    incorporationDate?: string
    dissolutionDate?: string
    companyType?: string
    currentStatus?: string
    registeredAddress?: string
    filingCount?: number
  }> {
    const url =
      `${this.baseUrl}/companies/${encodeURIComponent(jurisdiction)}/${encodeURIComponent(companyNumber)}` +
      `?api_token=${encodeURIComponent(this.apiKey!)}`

    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 OpenCorporates rate limit exceeded')
      throw new Error(
        `OpenCorporates company detail HTTP ${response.status}: ${response.statusText}`
      )
    }

    const data: OCCompanyDetailResponse = await response.json()

    if (data.error) {
      throw new Error(`OpenCorporates API error: ${data.error}`)
    }

    const c = data.results?.company

    return {
      name: c?.name,
      incorporationDate: c?.incorporation_date,
      dissolutionDate: c?.dissolution_date,
      companyType: c?.company_type,
      currentStatus: c?.current_status,
      registeredAddress: formatRegisteredAddress(c?.registered_address),
      filingCount: c?.filings_count,
    }
  }

  // -------------------------------------------------------------------------
  // Step 3: Officers
  // -------------------------------------------------------------------------

  /**
   * Fetch the officers list and transform to our director shape.
   * OpenCorporates uses "officer" to mean any appointed person (directors,
   * secretaries, etc.) — we expose all of them via the `role` field.
   */
  private async fetchOfficers(
    jurisdiction: string,
    companyNumber: string
  ): Promise<CorporateRegistryData['directors']> {
    const url =
      `${this.baseUrl}/companies/${encodeURIComponent(jurisdiction)}/${encodeURIComponent(companyNumber)}/officers` +
      `?api_token=${encodeURIComponent(this.apiKey!)}`

    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 OpenCorporates rate limit exceeded')
      throw new Error(
        `OpenCorporates officers HTTP ${response.status}: ${response.statusText}`
      )
    }

    const data: OCOfficersResponse = await response.json()

    if (data.error) {
      throw new Error(`OpenCorporates API error: ${data.error}`)
    }

    const officers = data.results?.officers ?? []

    return officers
      .map((entry) => {
        const o = entry.officer
        if (!o?.name) return null

        // An officer is active when they have no end_date and inactive is not true
        const isActive = !o.end_date && o.inactive !== true

        return {
          name: o.name,
          role: o.role ?? o.position ?? o.occupation,
          appointedOn: o.start_date,
          resignedOn: o.end_date,
          isActive,
        }
      })
      .filter((o): o is NonNullable<typeof o> => o !== null)
  }

  // -------------------------------------------------------------------------
  // Status helper
  // -------------------------------------------------------------------------

  getStatus() {
    return {
      connected: !this.degraded,
      degraded: this.degraded,
      apiKeyConfigured: !!this.apiKey,
    }
  }
}
