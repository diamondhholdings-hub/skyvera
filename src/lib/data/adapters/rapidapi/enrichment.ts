/**
 * RapidAPIEnrichmentAdapter - fetches company profile data from multiple RapidAPI enrichment APIs
 * Caches aggressively to stay within API rate limits
 *
 * APIs integrated (in priority order):
 *   1. Apollo Enrichment (apollo-enrichment.p.rapidapi.com)
 *   2. Company Enrichment API (company-enrichment.p.rapidapi.com)
 *   3. Crunchbase Real-Time (crunchbase-real-time-api.p.rapidapi.com)
 *   4. Company Data Enrich PRO (company-data-enrich.p.rapidapi.com)
 *   5. Enrichment API (enrichment-api.p.rapidapi.com)
 *   6. Company Intelligence (company-intelligence.p.rapidapi.com)
 */

import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager, CACHE_TTL } from '@/lib/cache/manager'

// ---------------------------------------------------------------------------
// Public type
// ---------------------------------------------------------------------------

export interface CompanyProfile {
  name: string
  domain?: string
  description?: string
  industry?: string
  employeeCount?: number
  employeeRange?: string // e.g. "1000-5000"
  foundedYear?: number
  headquarters?: string
  linkedinUrl?: string
  twitterHandle?: string
  totalFunding?: number // in USD
  lastFundingRound?: string // e.g. "Series C"
  lastFundingDate?: string
  fundingStage?: string // e.g. "Late Stage", "Public"
  isPublic?: boolean
  stockSymbol?: string
  technologies?: string[] // tech stack hints
  enrichedAt: string // ISO timestamp
  sources: string[] // which APIs contributed data
}

// ---------------------------------------------------------------------------
// Internal RapidAPI response shapes (loosely typed — APIs can vary)
// ---------------------------------------------------------------------------

interface ApolloOrganization {
  name?: string
  website_url?: string
  short_description?: string
  industry?: string
  estimated_num_employees?: number
  founded_year?: number
  city?: string
  country?: string
  linkedin_url?: string
  twitter_url?: string
  publicly_traded_symbol?: string
  publicly_traded_exchange?: string
  technology_names?: string[]
}

interface ApolloEnrichResponse {
  organization?: ApolloOrganization
  company?: ApolloOrganization // some endpoints wrap differently
}

interface CompanyEnrichmentResponse {
  name?: string
  domain?: string
  description?: string
  industry?: string
  employeeCount?: number
  employeeRange?: string
  location?: string
  city?: string
  country?: string
  founded?: number
  linkedin?: string
  twitter?: string
}

interface CrunchbaseAutocompleteItem {
  identifier?: {
    entity_def_id?: string
    permalink?: string
    uuid?: string
    value?: string
  }
  short_description?: string
}

interface CrunchbaseAutocompleteResponse {
  entities?: CrunchbaseAutocompleteItem[]
}

/**
 * Crunchbase organization properties as returned by the official v4 API.
 * The crunchbase-real-time-api RapidAPI wrapper proxies the official API,
 * so the same field shapes apply:
 *   - founded_on: { value: "YYYY-MM-DD", precision: "year"|"month"|"day" }
 *   - linkedin/twitter: { label: string, value: string }  (link objects)
 *   - num_employees_enum: string like "c_00001_00010" .. "c_10001_max"
 *   - funding_total: { value: number, currency: string, value_usd: number }
 *   - location_identifiers: array of { uuid, entity_def_id, location_type, permalink, value }
 *   - stock_symbol: identifier object { value: string } or plain string in some wrappers
 *   - ipo_status: plain string ("public" | "private" | "delisted")
 *
 * The top-level wrapper may be { properties: {...} } (standard) or
 * { data: { properties: {...} } } (some RapidAPI wrappers add this).
 * Both are handled in fetchCrunchbase below.
 */
interface CrunchbaseOrgProperties {
  short_description?: string
  founded_on?: { value?: string; precision?: string }
  // funding_total can be an object with value_usd (official API) or value+currency
  funding_total?: { value_usd?: number; value?: number; currency?: string }
  last_funding_type?: string
  last_funding_at?: string
  num_funding_rounds?: number
  ipo_status?: string
  // stock_symbol is an identifier object in v4 but some wrappers return a plain string
  stock_symbol?: { value?: string } | string
  // linkedin and twitter are link objects: { label, value }
  linkedin?: { value?: string; label?: string }
  twitter?: { value?: string; label?: string }
  num_employees_enum?: string
  // Official API uses location_identifiers (array); some wrappers expose headquarters_identifier
  location_identifiers?: Array<{ value?: string; location_type?: string; permalink?: string }>
  headquarters_identifier?: { value?: string }
  // Some wrappers may flatten headquarters to a plain string
  headquarters?: string
}

interface CrunchbaseOrgResponse {
  // Standard Crunchbase v4 entity lookup: top-level properties object
  properties?: CrunchbaseOrgProperties
  // Some RapidAPI wrappers add a "data" envelope
  data?: {
    properties?: CrunchbaseOrgProperties
  }
  // Rare: some wrappers return org fields at the root level
  short_description?: string
  founded_on?: { value?: string; precision?: string }
}

// Generic response shape shared by the three fallback sources
interface FallbackEnrichmentResponse {
  companyName?: string
  name?: string
  domain?: string
  website?: string
  description?: string
  industry?: string
  size?: string
  employees?: number
  employeeCount?: number
  location?: string
  headquarters?: string
  founded?: number
  foundedYear?: number
  linkedin?: string
  linkedinUrl?: string
}

// ---------------------------------------------------------------------------
// Domain inference helpers
// ---------------------------------------------------------------------------

/**
 * Best-effort domain inference from company name.
 * Handles common patterns (e.g. "British Telecommunications" → "bt.com").
 * This is intentionally simple — real domain is filled in by Apollo/enrichment APIs
 * when available.
 */
function inferDomain(companyName: string): string | undefined {
  const name = companyName.trim()

  // Known overrides for common enterprise names
  const knownDomains: Record<string, string> = {
    'british telecommunications': 'bt.com',
    bt: 'bt.com',
    'at&t': 'att.com',
    att: 'att.com',
    verizon: 'verizon.com',
    't-mobile': 't-mobile.com',
    tmobile: 't-mobile.com',
    vodafone: 'vodafone.com',
    microsoft: 'microsoft.com',
    google: 'google.com',
    amazon: 'amazon.com',
    salesforce: 'salesforce.com',
    oracle: 'oracle.com',
    sap: 'sap.com',
    cisco: 'cisco.com',
    ibm: 'ibm.com',
  }

  const lower = name.toLowerCase()
  for (const [key, domain] of Object.entries(knownDomains)) {
    if (lower.includes(key)) return domain
  }

  // Generic fallback: strip legal suffixes, lowercase, add .com
  const cleaned = name
    .toLowerCase()
    .replace(/\b(inc|corp|llc|ltd|limited|plc|gmbh|ag|sa|bv|nv|srl|pty|co)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim()

  if (cleaned.length >= 2) {
    return `${cleaned}.com`
  }

  return undefined
}

/**
 * Parse a Crunchbase num_employees_enum string into a human-readable range.
 * Crunchbase uses values like "c_00001_00010", "c_10001_25000", etc.
 */
function parseCrunchbaseEmployeeRange(raw?: string): string | undefined {
  if (!raw) return undefined
  const match = raw.match(/c_(\d+)_(\d+)/)
  if (match) {
    const lo = parseInt(match[1], 10).toLocaleString()
    const hi = parseInt(match[2], 10).toLocaleString()
    return `${lo}-${hi}`
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class RapidAPIEnrichmentAdapter implements DataAdapter {
  name = 'rapidapi-enrichment'

  private apiKey: string | undefined
  private cache = getCacheManager()
  private degraded = false // True when RAPIDAPI_KEY is missing

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY
  }

  // -------------------------------------------------------------------------
  // DataAdapter lifecycle
  // -------------------------------------------------------------------------

  async connect(): Promise<Result<void, Error>> {
    if (!this.apiKey) {
      console.warn(
        '[RapidAPIEnrichmentAdapter] RAPIDAPI_KEY not configured - adapter running in degraded mode'
      )
      this.degraded = true
      return ok(undefined) // Not a failure, just degraded
    }

    console.log('[RapidAPIEnrichmentAdapter] Connected successfully')
    this.degraded = false
    return ok(undefined)
  }

  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    // Accept 'customers' as the natural type for enrichment lookups.
    // The caller may also pass other types; we only handle what makes sense.
    if (query.type !== 'customers') {
      return err(
        new Error(
          `RapidAPI enrichment adapter only supports type 'customers', got '${query.type}'`
        )
      )
    }

    if (!query.filters?.customerName) {
      return err(new Error('RapidAPI enrichment query requires filters.customerName'))
    }

    if (this.degraded) {
      return err(new Error('RAPIDAPI_KEY not configured - cannot fetch company enrichment data'))
    }

    const companyName = query.filters.customerName
    const cacheKey = `enrichment:${companyName.toLowerCase().replace(/\s+/g, '-')}`

    try {
      const profile = await this.cache.get(
        cacheKey,
        async () => {
          return await this.fetchAndMergeProfiles(companyName)
        },
        { ttl: CACHE_TTL.NEWS, jitter: true } // 15 min — same tier as news enrichment
      )

      return ok({
        data: [profile],
        source: this.name,
        timestamp: new Date(),
        count: 1,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'

      if (msg.includes('429')) {
        return err(
          new Error(
            'RapidAPI rate limit exceeded (429). Cached enrichment data may be available.'
          )
        )
      }

      if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT')) {
        return err(new Error('RapidAPI network error - check internet connection'))
      }

      return err(new Error(`RapidAPI enrichment query failed: ${msg}`))
    }
  }

  async healthCheck(): Promise<boolean> {
    return !this.degraded
  }

  async disconnect(): Promise<void> {
    console.log('[RapidAPIEnrichmentAdapter] Disconnected')
  }

  // -------------------------------------------------------------------------
  // Orchestration: call all APIs in parallel and merge
  // -------------------------------------------------------------------------

  private async fetchAndMergeProfiles(companyName: string): Promise<CompanyProfile> {
    const sourceNames = [
      'apollo',
      'company-enrichment',
      'crunchbase',
      'company-data-enrich-pro',
      'enrichment-api',
      'company-intelligence',
    ]
    console.log(
      `[RapidAPIEnrichmentAdapter] Looking up "${companyName}" — trying sources: ${sourceNames.join(', ')}`
    )

    const domain = inferDomain(companyName)

    // Run all six APIs in parallel; failures are handled individually
    const [
      apolloResult,
      companyEnrichResult,
      crunchbaseResult,
      companyDataEnrichProResult,
      enrichmentApiResult,
      companyIntelligenceResult,
    ] = await Promise.allSettled([
      this.fetchApollo(companyName, domain),
      this.fetchCompanyEnrichment(companyName),
      this.fetchCrunchbase(companyName),
      this.fetchCompanyDataEnrichPro(companyName),
      this.fetchEnrichmentAPI(companyName),
      this.fetchCompanyIntelligence(companyName),
    ])

    // Collect partial profiles in priority order
    const partials: Partial<CompanyProfile>[] = []
    const sources: string[] = []

    if (apolloResult.status === 'fulfilled') {
      partials.push(apolloResult.value.data)
      sources.push('apollo')
    } else {
      console.warn('[RapidAPIEnrichmentAdapter] Apollo API failed:', apolloResult.reason)
    }

    if (companyEnrichResult.status === 'fulfilled') {
      partials.push(companyEnrichResult.value.data)
      sources.push('company-enrichment')
    } else {
      console.warn(
        '[RapidAPIEnrichmentAdapter] Company Enrichment API failed:',
        companyEnrichResult.reason
      )
    }

    if (crunchbaseResult.status === 'fulfilled') {
      partials.push(crunchbaseResult.value.data)
      sources.push('crunchbase')
    } else {
      console.warn('[RapidAPIEnrichmentAdapter] Crunchbase API failed:', crunchbaseResult.reason)
    }

    if (companyDataEnrichProResult.status === 'fulfilled') {
      partials.push(companyDataEnrichProResult.value.data)
      sources.push('company-data-enrich-pro')
    } else {
      console.warn(
        '[RapidAPIEnrichmentAdapter] Company Data Enrich PRO failed:',
        companyDataEnrichProResult.reason
      )
    }

    if (enrichmentApiResult.status === 'fulfilled') {
      partials.push(enrichmentApiResult.value.data)
      sources.push('enrichment-api')
    } else {
      console.warn(
        '[RapidAPIEnrichmentAdapter] Enrichment API failed:',
        enrichmentApiResult.reason
      )
    }

    if (companyIntelligenceResult.status === 'fulfilled') {
      partials.push(companyIntelligenceResult.value.data)
      sources.push('company-intelligence')
    } else {
      console.warn(
        '[RapidAPIEnrichmentAdapter] Company Intelligence API failed:',
        companyIntelligenceResult.reason
      )
    }

    if (partials.length === 0) {
      throw new Error(`All enrichment APIs failed for company "${companyName}"`)
    }

    // Merge: first non-undefined value wins for each field (Apollo has priority)
    const merged = this.mergePartials(companyName, partials, sources)

    console.log(
      `[RapidAPIEnrichmentAdapter] Enriched "${companyName}" from sources: ${sources.join(', ')}`
    )

    return merged
  }

  /**
   * Deep merge partial profiles in priority order.
   * For each field, the first non-undefined value is kept.
   */
  private mergePartials(
    companyName: string,
    partials: Partial<CompanyProfile>[],
    sources: string[]
  ): CompanyProfile {
    const merged: Partial<CompanyProfile> = {}

    const scalarFields: Array<keyof CompanyProfile> = [
      'name',
      'domain',
      'description',
      'industry',
      'employeeCount',
      'employeeRange',
      'foundedYear',
      'headquarters',
      'linkedinUrl',
      'twitterHandle',
      'totalFunding',
      'lastFundingRound',
      'lastFundingDate',
      'fundingStage',
      'isPublic',
      'stockSymbol',
    ]

    for (const field of scalarFields) {
      for (const partial of partials) {
        if (partial[field] !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(merged as any)[field] = partial[field]
          break
        }
      }
    }

    // Merge technologies: union across all sources
    const allTechs = new Set<string>()
    for (const partial of partials) {
      for (const t of partial.technologies ?? []) {
        allTechs.add(t)
      }
    }
    if (allTechs.size > 0) {
      merged.technologies = Array.from(allTechs)
    }

    return {
      name: merged.name ?? companyName,
      domain: merged.domain,
      description: merged.description,
      industry: merged.industry,
      employeeCount: merged.employeeCount,
      employeeRange: merged.employeeRange,
      foundedYear: merged.foundedYear,
      headquarters: merged.headquarters,
      linkedinUrl: merged.linkedinUrl,
      twitterHandle: merged.twitterHandle,
      totalFunding: merged.totalFunding,
      lastFundingRound: merged.lastFundingRound,
      lastFundingDate: merged.lastFundingDate,
      fundingStage: merged.fundingStage,
      isPublic: merged.isPublic,
      stockSymbol: merged.stockSymbol,
      technologies: merged.technologies,
      enrichedAt: new Date().toISOString(),
      sources,
    }
  }

  // -------------------------------------------------------------------------
  // API 1: Apollo Enrichment
  // Host: apollo-enrichment.p.rapidapi.com
  // -------------------------------------------------------------------------

  private async fetchApollo(
    companyName: string,
    domain?: string
  ): Promise<{ data: Partial<CompanyProfile> }> {
    const host = 'apollo-enrichment.p.rapidapi.com'

    // Apollo's organization enrichment requires a domain — name-only queries return 422.
    // Use the provided domain or fall back to inferDomain(). If neither is available, skip.
    const effectiveDomain = domain ?? inferDomain(companyName)
    if (!effectiveDomain) {
      console.warn(
        `[RapidAPIEnrichmentAdapter] Apollo: cannot infer domain for "${companyName}", skipping`
      )
      return { data: {} }
    }

    // Try the versioned path first (/api/v1/organizations/enrich); the RapidAPI proxy
    // for apollo-enrichment may strip the /api/v1 prefix, so we fall back to the
    // shorter path on 404.
    const buildUrl = (path: string) =>
      `https://${host}${path}?domain=${encodeURIComponent(effectiveDomain)}`

    const headers = {
      'X-RapidAPI-Key': this.apiKey!,
      'X-RapidAPI-Host': host,
    }

    let response = await fetch(buildUrl('/api/v1/organizations/enrich'), { headers })

    // If the versioned path returns 404, retry with the un-versioned path
    if (response.status === 404) {
      response = await fetch(buildUrl('/organizations/enrich'), { headers })
    }

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Apollo rate limit exceeded')
      throw new Error(`Apollo HTTP ${response.status}: ${response.statusText}`)
    }

    const raw: ApolloEnrichResponse = await response.json()
    const org: ApolloOrganization | undefined = raw.organization ?? raw.company

    if (!org) {
      return { data: {} }
    }

    // Build headquarters string from city + country
    const hqParts = [org.city, org.country].filter(Boolean)
    const headquarters = hqParts.length > 0 ? hqParts.join(', ') : undefined

    // Determine if public from stock symbol/exchange presence
    const isPublic =
      org.publicly_traded_symbol != null || org.publicly_traded_exchange != null
        ? true
        : undefined

    return {
      data: {
        name: org.name ?? companyName,
        domain: org.website_url
          ? org.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
          : domain,
        description: org.short_description,
        industry: org.industry,
        employeeCount: org.estimated_num_employees,
        foundedYear: org.founded_year,
        headquarters,
        linkedinUrl: org.linkedin_url,
        twitterHandle: org.twitter_url,
        isPublic,
        stockSymbol: org.publicly_traded_symbol,
        technologies: org.technology_names,
      },
    }
  }

  // -------------------------------------------------------------------------
  // API 2: Company Enrichment API
  // Host: company-enrichment.p.rapidapi.com
  // -------------------------------------------------------------------------

  private async fetchCompanyEnrichment(
    companyName: string
  ): Promise<{ data: Partial<CompanyProfile> }> {
    const host = 'company-enrichment.p.rapidapi.com'

    // The /api/v1/company path returns 404; the correct path appears to be /company.
    // Try /company first and fall back to /v1/company if still 404.
    const headers = {
      'X-RapidAPI-Key': this.apiKey!,
      'X-RapidAPI-Host': host,
    }
    const param = `name=${encodeURIComponent(companyName)}`

    let response = await fetch(`https://${host}/company?${param}`, { headers })

    if (response.status === 404) {
      response = await fetch(`https://${host}/v1/company?${param}`, { headers })
    }

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Company Enrichment rate limit exceeded')
      throw new Error(`Company Enrichment HTTP ${response.status}: ${response.statusText}`)
    }

    const raw: CompanyEnrichmentResponse = await response.json()

    // Build headquarters from location/city/country fields
    const hqFallback = [raw.city, raw.country].filter(Boolean).join(', ') || undefined
    const hq = raw.location ?? hqFallback

    return {
      data: {
        name: raw.name ?? companyName,
        domain: raw.domain,
        description: raw.description,
        industry: raw.industry,
        employeeCount: raw.employeeCount,
        employeeRange: raw.employeeRange,
        foundedYear: raw.founded,
        headquarters: hq,
        linkedinUrl: raw.linkedin,
        twitterHandle: raw.twitter,
      },
    }
  }

  // -------------------------------------------------------------------------
  // API 3: Crunchbase Real-Time
  // Host: crunchbase-real-time-api.p.rapidapi.com
  // Step 1: autocomplete to get entity_id
  // Step 2: fetch organization details
  // -------------------------------------------------------------------------

  private async fetchCrunchbase(companyName: string): Promise<{ data: Partial<CompanyProfile> }> {
    const host = 'crunchbase-real-time-api.p.rapidapi.com'

    // Step 1: autocomplete
    const autocompleteUrl = `https://${host}/v1/autocomplete2?query=${encodeURIComponent(companyName)}`

    const autocompleteResponse = await fetch(autocompleteUrl, {
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': host,
      },
    })

    if (!autocompleteResponse.ok) {
      if (autocompleteResponse.status === 429)
        throw new Error('429 Crunchbase rate limit exceeded')
      throw new Error(
        `Crunchbase autocomplete HTTP ${autocompleteResponse.status}: ${autocompleteResponse.statusText}`
      )
    }

    const autocompleteRaw = await autocompleteResponse.json()

    // The autocomplete2 endpoint matches the official Crunchbase v4 autocomplete shape:
    //   { entities: [ { identifier: { permalink, entity_def_id, uuid, value }, short_description }, ... ] }
    // Some wrappers may return { data: [ ... ] } or a bare array — handle all three.
    const autocompleteData: CrunchbaseAutocompleteResponse = autocompleteRaw
    let entities: CrunchbaseAutocompleteItem[] = []
    if (Array.isArray(autocompleteRaw)) {
      entities = autocompleteRaw
    } else if (Array.isArray(autocompleteRaw?.entities)) {
      entities = autocompleteRaw.entities
    } else if (Array.isArray(autocompleteRaw?.data)) {
      entities = autocompleteRaw.data
    }
    void autocompleteData // keep TS happy — we parsed manually above

    // Find the first "organization" entity
    const orgEntity = entities.find(
      (e) => e.identifier?.entity_def_id === 'organization' || e.identifier?.permalink
    )

    if (!orgEntity?.identifier?.permalink) {
      console.warn(
        `[RapidAPIEnrichmentAdapter] Crunchbase: no organization found for "${companyName}". ` +
          `autocomplete returned ${entities.length} entity(ies).`
      )
      return { data: {} }
    }

    // Step 2: fetch organization by permalink (used as organization_identifier)
    const entityId = orgEntity.identifier.permalink
    const orgUrl = `https://${host}/v1/organization?organization_identifier=${encodeURIComponent(entityId)}&format=Raw`

    const orgResponse = await fetch(orgUrl, {
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': host,
      },
    })

    if (!orgResponse.ok) {
      if (orgResponse.status === 429) throw new Error('429 Crunchbase rate limit exceeded')
      throw new Error(
        `Crunchbase organization HTTP ${orgResponse.status}: ${orgResponse.statusText}`
      )
    }

    const orgData: CrunchbaseOrgResponse = await orgResponse.json()

    // Resolve properties from multiple possible wrapper shapes:
    //   1. { properties: { ... } }           — standard Crunchbase v4 entity lookup
    //   2. { data: { properties: { ... } } } — some RapidAPI wrappers add a data envelope
    //   3. fields at the root level           — some wrappers flatten the response
    const props: CrunchbaseOrgProperties | undefined =
      orgData.properties ?? orgData.data?.properties ?? undefined

    if (!props) {
      // Check if the wrapper returned a flat/root-level response
      const hasRootFields = orgData.short_description != null || orgData.founded_on != null
      if (hasRootFields) {
        // Treat the root object itself as properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const flatProps = orgData as any as CrunchbaseOrgProperties
        return this.buildCrunchbaseProfile(flatProps)
      }
      console.warn(
        `[RapidAPIEnrichmentAdapter] Crunchbase: org response had no recognisable properties for "${companyName}"`
      )
      return { data: {} }
    }

    return this.buildCrunchbaseProfile(props)
  }

  /**
   * Build a CompanyProfile partial from a resolved CrunchbaseOrgProperties object.
   * Handles the official v4 field shapes documented at data.crunchbase.com.
   */
  private buildCrunchbaseProfile(props: CrunchbaseOrgProperties): { data: Partial<CompanyProfile> } {
    // Parse funding stage from IPO status
    const ipoStatus = props.ipo_status
    let fundingStage: string | undefined
    if (ipoStatus === 'public') {
      fundingStage = 'Public'
    } else if (ipoStatus === 'private') {
      // Map last_funding_type to a human-friendly stage
      const ft = props.last_funding_type
      if (ft) {
        fundingStage =
          ft === 'series_a'
            ? 'Series A'
            : ft === 'series_b'
              ? 'Series B'
              : ft === 'series_c'
                ? 'Series C'
                : ft === 'series_d'
                  ? 'Series D'
                  : ft === 'series_e'
                    ? 'Series E'
                    : ft === 'venture'
                      ? 'Venture'
                      : ft === 'seed'
                        ? 'Seed'
                        : ft === 'pre_seed'
                          ? 'Pre-Seed'
                          : ft === 'private_equity'
                            ? 'Private Equity'
                            : ft === 'post_ipo_equity'
                              ? 'Post-IPO'
                              : ft
      }
    }

    // Format lastFundingRound to a display string
    const lastFundingType = props.last_funding_type
    const lastFundingRound = lastFundingType
      ? lastFundingType
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : undefined

    const employeeRange = parseCrunchbaseEmployeeRange(props.num_employees_enum)

    // funding_total: official API returns { value_usd, value, currency }
    const totalFunding = props.funding_total?.value_usd ?? props.funding_total?.value

    // stock_symbol: v4 returns an identifier object { value: "TSLA" }; some wrappers may return a plain string
    const stockSymbol =
      typeof props.stock_symbol === 'string'
        ? props.stock_symbol
        : props.stock_symbol?.value

    // headquarters: prefer location_identifiers array (pick the city/region entry first),
    // fall back to headquarters_identifier, then a plain string
    let headquarters: string | undefined
    if (props.location_identifiers && props.location_identifiers.length > 0) {
      // Prefer city/region over country if multiple entries are present
      const cityEntry = props.location_identifiers.find(
        (loc) => loc.location_type === 'city' || loc.location_type === 'region'
      )
      const countryEntry = props.location_identifiers.find(
        (loc) => loc.location_type === 'country'
      )
      const best = cityEntry ?? countryEntry ?? props.location_identifiers[0]
      headquarters = best?.value
      // If we have both city and country, combine them
      if (cityEntry && countryEntry && cityEntry !== countryEntry) {
        headquarters = `${cityEntry.value}, ${countryEntry.value}`
      }
    } else {
      headquarters = props.headquarters_identifier?.value ?? props.headquarters
    }

    return {
      data: {
        description: props.short_description,
        foundedYear: props.founded_on?.value
          ? parseInt(props.founded_on.value.substring(0, 4), 10)
          : undefined,
        totalFunding,
        lastFundingRound,
        lastFundingDate: props.last_funding_at,
        fundingStage,
        isPublic: ipoStatus === 'public' ? true : ipoStatus === 'private' ? false : undefined,
        stockSymbol,
        linkedinUrl: props.linkedin?.value,
        twitterHandle: props.twitter?.value,
        employeeRange,
        headquarters,
      },
    }
  }

  // -------------------------------------------------------------------------
  // API 4: Company Data Enrich PRO (fallback)
  // Host: company-data-enrich.p.rapidapi.com
  // -------------------------------------------------------------------------

  private async fetchCompanyDataEnrichPro(
    companyName: string
  ): Promise<{ data: Partial<CompanyProfile> }> {
    const host = 'company-data-enrich.p.rapidapi.com'
    const url = `https://${host}/company?name=${encodeURIComponent(companyName)}`

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': host,
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Company Data Enrich PRO rate limit exceeded')
      throw new Error(`Company Data Enrich PRO HTTP ${response.status}: ${response.statusText}`)
    }

    const raw: FallbackEnrichmentResponse = await response.json()
    const domain =
      raw.domain ??
      raw.website?.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]

    return {
      data: {
        name: raw.companyName ?? raw.name ?? companyName,
        domain,
        description: raw.description,
        industry: raw.industry,
        employeeRange: raw.size,
        employeeCount: raw.employees ?? raw.employeeCount,
        headquarters: raw.headquarters ?? raw.location,
        foundedYear: raw.foundedYear ?? raw.founded,
        linkedinUrl: raw.linkedinUrl ?? raw.linkedin,
      },
    }
  }

  // -------------------------------------------------------------------------
  // API 5: Enrichment API (fallback)
  // Host: enrichment-api.p.rapidapi.com
  // -------------------------------------------------------------------------

  private async fetchEnrichmentAPI(
    companyName: string
  ): Promise<{ data: Partial<CompanyProfile> }> {
    const host = 'enrichment-api.p.rapidapi.com'
    const url = `https://${host}/company?name=${encodeURIComponent(companyName)}`

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': host,
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Enrichment API rate limit exceeded')
      throw new Error(`Enrichment API HTTP ${response.status}: ${response.statusText}`)
    }

    const raw: FallbackEnrichmentResponse = await response.json()
    const domain =
      raw.domain ??
      raw.website?.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]

    return {
      data: {
        name: raw.companyName ?? raw.name ?? companyName,
        domain,
        description: raw.description,
        industry: raw.industry,
        employeeRange: raw.size,
        employeeCount: raw.employees ?? raw.employeeCount,
        headquarters: raw.headquarters ?? raw.location,
        foundedYear: raw.foundedYear ?? raw.founded,
        linkedinUrl: raw.linkedinUrl ?? raw.linkedin,
      },
    }
  }

  // -------------------------------------------------------------------------
  // API 6: Company Intelligence (fallback)
  // Host: company-intelligence.p.rapidapi.com
  // -------------------------------------------------------------------------

  private async fetchCompanyIntelligence(
    companyName: string
  ): Promise<{ data: Partial<CompanyProfile> }> {
    const host = 'company-intelligence.p.rapidapi.com'
    const url = `https://${host}/company?name=${encodeURIComponent(companyName)}`

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': host,
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Company Intelligence rate limit exceeded')
      throw new Error(`Company Intelligence HTTP ${response.status}: ${response.statusText}`)
    }

    const raw: FallbackEnrichmentResponse = await response.json()
    const domain =
      raw.domain ??
      raw.website?.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]

    return {
      data: {
        name: raw.companyName ?? raw.name ?? companyName,
        domain,
        description: raw.description,
        industry: raw.industry,
        employeeRange: raw.size,
        employeeCount: raw.employees ?? raw.employeeCount,
        headquarters: raw.headquarters ?? raw.location,
        foundedYear: raw.foundedYear ?? raw.founded,
        linkedinUrl: raw.linkedinUrl ?? raw.linkedin,
      },
    }
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
