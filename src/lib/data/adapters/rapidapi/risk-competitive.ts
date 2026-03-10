/**
 * RiskCompetitiveAdapter - fetches risk signals, competitive intelligence,
 * and market perception data via multiple RapidAPI endpoints.
 *
 * Integrates 8 APIs in parallel with per-source try/catch so partial failures
 * never block the overall result. Caches at 4-hour TTL to protect quota limits.
 */

import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager } from '@/lib/cache/manager'

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface RiskCompetitiveProfile {
  companyName: string

  // Risk signals
  bankruptcyRisk: {
    flag: boolean
    details?: string
    filingDate?: string
    chapter?: string // "7", "11", "15"
  }

  fundingHealth: {
    lastRoundDate?: string
    lastRoundAmount?: number
    lastRoundType?: string // Seed, Series A/B/C, PE, Public
    monthsSinceLastRound?: number
    signal: 'healthy' | 'watch' | 'risk' | 'unknown'
    // signal logic: funded <12mo = healthy, 12-24mo = watch, >24mo or declining = risk
  }

  webPresence: {
    monthlyVisits?: number
    visitsTrend?: 'growing' | 'stable' | 'declining' | 'unknown' // vs last 6mo
    globalRank?: number
    category?: string
  }

  marketPerception: {
    g2Rating?: number // out of 5
    g2ReviewCount?: number
    glassdoorRating?: number // out of 5
    trustpilotRating?: number // out of 5
    overallSentiment: 'positive' | 'neutral' | 'negative' | 'unknown'
  }

  cyberIncidents: {
    recentBreach: boolean
    incidentCount12mo?: number
    lastIncidentDate?: string
  }

  competitorLandscape: {
    primaryCompetitors: string[] // company names
    marketPosition?: string // "Leader", "Challenger", "Niche"
  }

  enrichedAt: string
}

// ---------------------------------------------------------------------------
// RapidAPI raw response shapes (inline – no external schema dependency)
// ---------------------------------------------------------------------------

/** Bankruptcy Search */
interface BankruptcySearchResponse {
  results?: Array<{
    company?: string
    filingDate?: string
    chapter?: string
    details?: string
  }>
  error?: string
}

/** Funding Tracker – funding search (returns rounds directly) */
interface FundingTrackerSearchResponse {
  data?: Array<{
    company_name?: string
    amount?: number
    stage?: string
    date?: string
  }>
  error?: string
}

/** Similarweb */
interface SimilarwebResponse {
  monthlyVisits?: number
  visits?: number
  global_rank?: number
  category?: string
  engagements?: { visits?: number }
  error?: string
}

/** G2 Data API */
type G2SearchResponse =
  | Array<{ star_rating?: number; reviews_count?: number; product_name?: string }>
  | { products?: Array<{ star_rating?: number; reviews_count?: number; product_name?: string }>; error?: string }

/** Glassdoor Real-Time */
interface GlassdoorSearchResponse {
  employers?: Array<{
    name?: string
    overallRating?: number
    numberOfRatings?: number
  }>
  data?: Array<{
    name?: string
    overallRating?: number
  }>
  error?: string
}

/** Trustpilot */
interface TrustpilotSearchResponse {
  businessUnits?: Array<{
    displayName?: string
    trustScore?: number
    numberOfReviews?: { total?: number }
  }>
  data?: Array<{
    displayName?: string
    trustScore?: number
  }>
  error?: string
}

/** Market Intelligence – similar companies */
interface MarketIntelligenceResponse {
  similar_companies?: Array<{
    name?: string
    company_name?: string
  }>
  companies?: Array<{
    name?: string
    company_name?: string
  }>
  market_position?: string
  error?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 4-hour TTL – risk/competitive data changes slowly; protects quota */
const RISK_COMPETITIVE_TTL = 14400

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class RiskCompetitiveAdapter implements DataAdapter {
  name = 'rapidapi-risk-competitive'

  private apiKey: string | undefined
  private cache = getCacheManager()
  private degraded = false // true when RAPIDAPI_KEY is absent

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY
  }

  // -------------------------------------------------------------------------
  // DataAdapter interface
  // -------------------------------------------------------------------------

  /**
   * Connect: verify API key exists; degrade gracefully if missing.
   */
  async connect(): Promise<Result<void, Error>> {
    if (!this.apiKey) {
      console.warn(
        '[RiskCompetitiveAdapter] RAPIDAPI_KEY not configured - adapter running in degraded mode'
      )
      this.degraded = true
      return ok(undefined) // Not a failure, just degraded
    }

    console.log('[RiskCompetitiveAdapter] Connected successfully')
    this.degraded = false
    return ok(undefined)
  }

  /**
   * Query risk & competitive profile for a given company name.
   * Accepts type 'customers' (primary use-case) as well as a future-proof
   * 'risk-competitive' type handled by the string check below.
   */
  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    if (query.type !== 'customers') {
      return err(
        new Error(
          `RiskCompetitive adapter only supports type 'customers', got '${query.type}'`
        )
      )
    }

    if (!query.filters?.customerName) {
      return err(new Error('RiskCompetitive query requires filters.customerName'))
    }

    if (this.degraded) {
      return err(new Error('RAPIDAPI_KEY not configured - cannot fetch risk/competitive data'))
    }

    const companyName = query.filters.customerName
    const cacheKey = `rapidapi-risk-competitive:${companyName}`

    try {
      const profile = await this.cache.get(
        cacheKey,
        async () => {
          return await this.buildProfile(companyName)
        },
        { ttl: RISK_COMPETITIVE_TTL, jitter: true }
      )

      return ok({
        data: [profile],
        source: this.name,
        timestamp: new Date(),
        count: 1,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (errorMessage.includes('429')) {
        return err(
          new Error('RapidAPI rate limit exceeded. Cached risk/competitive data may be available.')
        )
      }

      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ETIMEDOUT')) {
        return err(new Error('RapidAPI network error - check internet connection'))
      }

      return err(new Error(`RiskCompetitive query failed: ${errorMessage}`))
    }
  }

  /**
   * Health check - degraded mode is still "healthy" (just limited).
   */
  async healthCheck(): Promise<boolean> {
    return true
  }

  /**
   * Disconnect - no-op for HTTP adapter.
   */
  async disconnect(): Promise<void> {
    console.log('[RiskCompetitiveAdapter] Disconnected')
  }

  /**
   * Get adapter status.
   */
  getStatus() {
    return {
      connected: !this.degraded,
      degraded: this.degraded,
      apiKeyConfigured: !!this.apiKey,
    }
  }

  // -------------------------------------------------------------------------
  // Core orchestrator – fires all 8 APIs in parallel
  // -------------------------------------------------------------------------

  /**
   * Fire all source-specific fetchers in parallel.
   * Each fetcher is independently try/caught so one failure does not prevent
   * the others from contributing to the final profile.
   */
  private async buildProfile(companyName: string): Promise<RiskCompetitiveProfile> {
    console.log(`[RiskCompetitiveAdapter] Building risk/competitive profile for "${companyName}"`)

    const [
      bankruptcyResult,
      fundingResult,
      webResult,
      g2Result,
      glassdoorResult,
      trustpilotResult,
      competitorResult,
    ] = await Promise.allSettled([
      this.fetchBankruptcy(companyName),
      this.fetchFunding(companyName),
      this.fetchWebPresence(companyName),
      this.fetchG2(companyName),
      this.fetchGlassdoor(companyName),
      this.fetchTrustpilot(companyName),
      this.fetchCompetitors(companyName),
    ])

    // Extract fulfilled values; warn on failures but don't throw
    const bankruptcy = bankruptcyResult.status === 'fulfilled' ? bankruptcyResult.value : null
    const funding = fundingResult.status === 'fulfilled' ? fundingResult.value : null
    const web = webResult.status === 'fulfilled' ? webResult.value : null
    const g2 = g2Result.status === 'fulfilled' ? g2Result.value : null
    const glassdoor = glassdoorResult.status === 'fulfilled' ? glassdoorResult.value : null
    const trustpilot = trustpilotResult.status === 'fulfilled' ? trustpilotResult.value : null
    const competitors = competitorResult.status === 'fulfilled' ? competitorResult.value : null

    if (bankruptcyResult.status === 'rejected') {
      console.warn('[RiskCompetitiveAdapter] Bankruptcy API failed:', bankruptcyResult.reason)
    }
    if (fundingResult.status === 'rejected') {
      console.warn('[RiskCompetitiveAdapter] Funding Tracker API failed:', fundingResult.reason)
    }
    if (webResult.status === 'rejected') {
      console.warn('[RiskCompetitiveAdapter] Similarweb API failed:', webResult.reason)
    }
    if (g2Result.status === 'rejected') {
      console.warn('[RiskCompetitiveAdapter] G2 API failed:', g2Result.reason)
    }
    if (glassdoorResult.status === 'rejected') {
      console.warn('[RiskCompetitiveAdapter] Glassdoor API failed:', glassdoorResult.reason)
    }
    if (trustpilotResult.status === 'rejected') {
      console.warn('[RiskCompetitiveAdapter] Trustpilot API failed:', trustpilotResult.reason)
    }
    if (competitorResult.status === 'rejected') {
      console.warn(
        '[RiskCompetitiveAdapter] Market Intelligence API failed:',
        competitorResult.reason
      )
    }

    // Competitor list from Market Intelligence
    const mergedCompetitors: RiskCompetitiveProfile['competitorLandscape'] =
      competitors ?? { primaryCompetitors: [] }

    // Web presence from Similarweb
    const mergedWeb: RiskCompetitiveProfile['webPresence'] = web ?? {}

    // Assemble market perception + overall sentiment
    const marketPerception = this.assembleMarketPerception(g2, glassdoor, trustpilot)

    const profile: RiskCompetitiveProfile = {
      companyName,
      bankruptcyRisk: bankruptcy ?? { flag: false },
      fundingHealth: funding ?? { signal: 'unknown' },
      webPresence: mergedWeb,
      marketPerception,
      cyberIncidents: { recentBreach: false },
      competitorLandscape: mergedCompetitors,
      enrichedAt: new Date().toISOString(),
    }

    console.log(
      `[RiskCompetitiveAdapter] Profile assembled for "${companyName}" — bankruptcyFlag=${profile.bankruptcyRisk.flag}, fundingSignal=${profile.fundingHealth.signal}, sentiment=${profile.marketPerception.overallSentiment}`
    )

    return profile
  }

  // -------------------------------------------------------------------------
  // API 1: Bankruptcy Search
  // -------------------------------------------------------------------------

  private async fetchBankruptcy(
    companyName: string
  ): Promise<RiskCompetitiveProfile['bankruptcyRisk']> {
    const url = `https://bankruptcy-search.p.rapidapi.com/search?company=${encodeURIComponent(companyName)}`

    console.log(`[RiskCompetitiveAdapter] Calling: ${url}`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'bankruptcy-search.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`Bankruptcy Search HTTP ${response.status}: ${response.statusText}`)
    }

    const data: BankruptcySearchResponse = await response.json()

    if (data.error) {
      throw new Error(`Bankruptcy Search error: ${data.error}`)
    }

    const results = data.results ?? []

    if (results.length === 0) {
      return { flag: false }
    }

    // Use the most recent filing (first result)
    const filing = results[0]

    return {
      flag: true,
      details: filing.details,
      filingDate: filing.filingDate,
      chapter: filing.chapter,
    }
  }

  // -------------------------------------------------------------------------
  // API 2: Funding Tracker
  // -------------------------------------------------------------------------

  private async fetchFunding(
    companyName: string
  ): Promise<RiskCompetitiveProfile['fundingHealth']> {
    const url = `https://funding-tracker.p.rapidapi.com/funding/search?q=${encodeURIComponent(companyName)}&limit=5`

    console.log(`[RiskCompetitiveAdapter] Calling: ${url}`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'funding-tracker.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(
        `Funding Tracker search HTTP ${response.status}: ${response.statusText}`
      )
    }

    const searchData: FundingTrackerSearchResponse = await response.json()

    if (searchData.error) {
      throw new Error(`Funding Tracker search error: ${searchData.error}`)
    }

    const rounds = searchData.data ?? []

    if (rounds.length === 0) {
      return { signal: 'unknown' }
    }

    // Sort by date descending to get the most recent round
    const sorted = [...rounds].sort((a, b) => {
      const dateA = new Date(a.date ?? 0).getTime()
      const dateB = new Date(b.date ?? 0).getTime()
      return dateB - dateA
    })

    const latest = sorted[0]
    const lastRoundDate = latest.date
    const lastRoundAmount = latest.amount
    const lastRoundType = latest.stage

    const signal = this.deriveFundingSignal(lastRoundDate)
    const monthsSinceLastRound = lastRoundDate
      ? Math.floor(
          (Date.now() - new Date(lastRoundDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      : undefined

    return {
      lastRoundDate,
      lastRoundAmount,
      lastRoundType,
      monthsSinceLastRound,
      signal,
    }
  }

  // -------------------------------------------------------------------------
  // API 3: Similarweb
  // -------------------------------------------------------------------------

  private async fetchWebPresence(
    companyName: string
  ): Promise<RiskCompetitiveProfile['webPresence']> {
    // Derive a best-guess domain from the company name
    const domain = this.guessDomain(companyName)

    const url = `https://similarweb-data1.p.rapidapi.com/v2/website-analytics/?domain=${encodeURIComponent(domain)}`

    console.log(`[RiskCompetitiveAdapter] Calling: ${url}`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'similarweb-data1.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`Similarweb HTTP ${response.status}: ${response.statusText}`)
    }

    const data: SimilarwebResponse = await response.json()

    if (data.error) {
      throw new Error(`Similarweb error: ${data.error}`)
    }

    const monthlyVisits = data.monthlyVisits ?? data.visits ?? data.engagements?.visits

    return {
      monthlyVisits,
      globalRank: data.global_rank,
      category: data.category,
    }
  }

  // -------------------------------------------------------------------------
  // API 4: G2 Data
  // -------------------------------------------------------------------------

  private async fetchG2(
    companyName: string
  ): Promise<{ rating?: number; reviewCount?: number } | null> {
    const url = `https://g2-data-api.p.rapidapi.com/g2-products?product=${encodeURIComponent(companyName)}&max_reviews=10`

    console.log(`[RiskCompetitiveAdapter] Calling: ${url}`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'g2-data-api.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`G2 API HTTP ${response.status}: ${response.statusText}`)
    }

    const data: G2SearchResponse = await response.json()

    if (!Array.isArray(data) && data.error) {
      throw new Error(`G2 API error: ${data.error}`)
    }

    const products = Array.isArray(data) ? data : (data.products ?? [])

    if (products.length === 0) {
      return null
    }

    const top = products[0]

    return {
      rating: top.star_rating,
      reviewCount: top.reviews_count,
    }
  }

  // -------------------------------------------------------------------------
  // API 5: Glassdoor Real-Time
  // -------------------------------------------------------------------------

  private async fetchGlassdoor(
    companyName: string
  ): Promise<{ rating?: number } | null> {
    const url = `https://glassdoor-real-time.p.rapidapi.com/companies/search?keyword=${encodeURIComponent(companyName)}`

    console.log(`[RiskCompetitiveAdapter] Calling: ${url}`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'glassdoor-real-time.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`Glassdoor API HTTP ${response.status}: ${response.statusText}`)
    }

    const data: GlassdoorSearchResponse = await response.json()

    if (data.error) {
      throw new Error(`Glassdoor API error: ${data.error}`)
    }

    const employers = data.employers ?? data.data ?? []

    if (employers.length === 0) {
      return null
    }

    return { rating: employers[0].overallRating }
  }

  // -------------------------------------------------------------------------
  // API 6: Trustpilot
  // -------------------------------------------------------------------------

  private async fetchTrustpilot(
    companyName: string
  ): Promise<{ rating?: number } | null> {
    const url = `https://trustpilot-company-and-reviews-data.p.rapidapi.com/company-search?query=${encodeURIComponent(companyName)}`

    console.log(`[RiskCompetitiveAdapter] Calling: ${url}`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'trustpilot-company-and-reviews-data.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`Trustpilot API HTTP ${response.status}: ${response.statusText}`)
    }

    const data: TrustpilotSearchResponse = await response.json()

    if (data.error) {
      throw new Error(`Trustpilot API error: ${data.error}`)
    }

    const units = data.businessUnits ?? data.data ?? []

    if (units.length === 0) {
      return null
    }

    return { rating: units[0].trustScore }
  }

  // -------------------------------------------------------------------------
  // API 7: Market Intelligence – competitors
  // -------------------------------------------------------------------------

  private async fetchCompetitors(
    companyName: string
  ): Promise<RiskCompetitiveProfile['competitorLandscape']> {
    const url = `https://market-intelligence-competitors-lookalikes-and-more.p.rapidapi.com/similar-companies?q=${encodeURIComponent(companyName)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'market-intelligence-competitors-lookalikes-and-more.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`Market Intelligence HTTP ${response.status}: ${response.statusText}`)
    }

    const data: MarketIntelligenceResponse = await response.json()

    if (data.error) {
      throw new Error(`Market Intelligence error: ${data.error}`)
    }

    const raw = data.similar_companies ?? data.companies ?? []

    const primaryCompetitors = raw
      .map((c) => c.name ?? c.company_name ?? '')
      .filter(Boolean)
      .slice(0, 10)

    return {
      primaryCompetitors,
      marketPosition: data.market_position,
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Derive fundingHealth.signal from the date of the last round.
   * funded <12mo = healthy, 12-24mo = watch, >24mo = risk, no date = unknown
   */
  private deriveFundingSignal(
    lastRoundDate: string | undefined
  ): RiskCompetitiveProfile['fundingHealth']['signal'] {
    if (!lastRoundDate) return 'unknown'
    const monthsAgo =
      (Date.now() - new Date(lastRoundDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (monthsAgo < 12) return 'healthy'
    if (monthsAgo < 24) return 'watch'
    return 'risk'
  }

  /**
   * Assemble marketPerception from three optional sources and compute a
   * simple overall sentiment label.
   */
  private assembleMarketPerception(
    g2: { rating?: number; reviewCount?: number } | null,
    glassdoor: { rating?: number } | null,
    trustpilot: { rating?: number } | null
  ): RiskCompetitiveProfile['marketPerception'] {
    const g2Rating = g2?.rating
    const g2ReviewCount = g2?.reviewCount
    const glassdoorRating = glassdoor?.rating
    const trustpilotRating = trustpilot?.rating

    const overallSentiment = this.deriveOverallSentiment(
      g2Rating,
      glassdoorRating,
      trustpilotRating
    )

    return {
      g2Rating,
      g2ReviewCount,
      glassdoorRating,
      trustpilotRating,
      overallSentiment,
    }
  }

  /**
   * Compute overall sentiment from available ratings.
   * Ratings are normalised to 0–1 before averaging.
   *   G2 / Glassdoor: out of 5   → divide by 5
   *   Trustpilot: out of 5       → divide by 5
   * Thresholds: ≥0.7 = positive, ≤0.4 = negative, else neutral
   */
  private deriveOverallSentiment(
    g2Rating: number | undefined,
    glassdoorRating: number | undefined,
    trustpilotRating: number | undefined
  ): RiskCompetitiveProfile['marketPerception']['overallSentiment'] {
    const normalised: number[] = []

    if (g2Rating !== undefined) normalised.push(g2Rating / 5)
    if (glassdoorRating !== undefined) normalised.push(glassdoorRating / 5)
    if (trustpilotRating !== undefined) normalised.push(trustpilotRating / 5)

    if (normalised.length === 0) return 'unknown'

    const avg = normalised.reduce((s, v) => s + v, 0) / normalised.length

    if (avg >= 0.7) return 'positive'
    if (avg <= 0.4) return 'negative'
    return 'neutral'
  }

  /**
   * Best-effort domain guess: lower-case the company name, strip common
   * suffixes, replace spaces with hyphens, and append .com.
   * Callers that have a verified domain should pass it directly instead.
   */
  private guessDomain(companyName: string): string {
    return companyName
      .toLowerCase()
      .replace(/\b(inc|llc|ltd|corp|co|group|holdings|technologies|solutions)\b\.?/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '.com'
  }
}
