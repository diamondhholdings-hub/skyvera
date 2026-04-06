/**
 * RapidAPIFinancialIntelAdapter - fetches public company financial data from RapidAPI
 * Integrates SEC EDGAR, Yahoo Finance, Real-Time Finance Data, and Financial Modeling Prep
 * Caches for 24h as financial data changes infrequently
 */

import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager, CACHE_TTL } from '@/lib/cache/manager'

// 24-hour TTL in seconds (financial data doesn't change frequently)
const FINANCIAL_INTEL_TTL = 24 * 60 * 60

/**
 * Public company financial intelligence
 */
export interface PublicCompanyFinancials {
  symbol?: string
  companyName: string
  isPublic: boolean
  marketCap?: number
  revenue?: {
    annual?: number
    quarterly?: number
    currency?: string
  }
  revenueGrowth?: number // YoY percentage
  profitMargin?: number
  debtToEquity?: number
  currentRatio?: number
  latestEarnings?: {
    quarter: string
    eps?: number
    revenueActual?: number
    revenueSurprise?: number // positive = beat, negative = miss
  }
  secFilings?: Array<{
    type: string // 10-K, 10-Q, 8-K
    date: string
    description: string
    url: string
  }>
  analystRating?: string // Strong Buy, Buy, Hold, Sell, Strong Sell
  priceTarget?: number
  enrichedAt: string
}

// ─── API response shapes ──────────────────────────────────────────────────────

interface YahooSearchResult {
  quotes?: Array<{
    symbol?: string
    shortname?: string
    longname?: string
    quoteType?: string
    exchDisp?: string
  }>
}

interface YahooModulesResult {
  body?: {
    financialData?: {
      totalRevenue?: { raw?: number }
      revenueGrowth?: { raw?: number }
      grossMargins?: { raw?: number }
      profitMargins?: { raw?: number }
      debtToEquity?: { raw?: number }
      currentRatio?: { raw?: number }
      targetMeanPrice?: { raw?: number }
      recommendationKey?: string
    }
    defaultKeyStatistics?: {
      marketCap?: { raw?: number }
      trailingEps?: { raw?: number }
      quarterlyRevenueGrowth?: { raw?: number }
    }
    earnings?: {
      financialsChart?: {
        quarterly?: Array<{
          date?: string
          revenue?: { raw?: number }
          earnings?: { raw?: number }
        }>
      }
    }
  }
}

interface SecEdgarResult {
  hits?: {
    hits?: Array<{
      _source?: {
        form_type?: string
        file_date?: string
        display_date_filed?: string
        period_of_report?: string
        entity_name?: string
        file_num?: string
        period?: string
      }
      _id?: string
    }>
  }
  query?: string
}

interface RealTimeCompanyInfo {
  data?: {
    symbol?: string
    name?: string
    market_cap?: number
    revenue?: number
    currency?: string
    pe_ratio?: number
    eps?: number
  }
  status?: string
}

interface FMPIncomeStatement {
  symbol?: string
  date?: string
  period?: string
  revenue?: number
  grossProfit?: number
  netIncome?: number
  eps?: number
  revenueGrowth?: number
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * RapidAPIFinancialIntelAdapter - enriches customer accounts with public company financials
 * Most valuable for churn risk detection: declining revenue + earnings misses = at-risk signal
 */
export class RapidAPIFinancialIntelAdapter implements DataAdapter {
  name = 'rapidapi-financial-intel'

  private apiKey: string | undefined
  private cache = getCacheManager()
  private degraded = false // Adapter is degraded if API key missing (not failed)

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY
  }

  /**
   * Connect: Verify API key exists
   */
  async connect(): Promise<Result<void, Error>> {
    if (!this.apiKey) {
      console.warn(
        '[RapidAPIFinancialIntelAdapter] RAPIDAPI_KEY not configured - adapter running in degraded mode'
      )
      this.degraded = true
      return ok(undefined) // Not a failure, just degraded
    }

    console.log('[RapidAPIFinancialIntelAdapter] Connected successfully')
    this.degraded = false
    return ok(undefined)
  }

  /**
   * Query financial intelligence for a customer
   */
  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    if (query.type !== 'financials') {
      return err(
        new Error(
          `RapidAPIFinancialIntel adapter only supports type 'financials', got '${query.type}'`
        )
      )
    }

    if (!query.filters?.customerName) {
      return err(new Error('RapidAPIFinancialIntel query requires filters.customerName'))
    }

    if (this.degraded) {
      return ok({ data: [], source: this.name, timestamp: new Date(), count: 0 })
    }

    const customerName = query.filters.customerName

    // Check cache first (24h TTL — financial data doesn't change frequently)
    const cacheKey = `financial-intel:${customerName.toLowerCase().replace(/\s+/g, '-')}`

    try {
      const financials = await this.cache.get(
        cacheKey,
        async () => {
          return await this.fetchFinancials(customerName)
        },
        { ttl: FINANCIAL_INTEL_TTL, jitter: true }
      )

      return ok({
        data: [financials],
        source: this.name,
        timestamp: new Date(),
        count: 1,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (errorMessage.includes('429')) {
        return err(
          new Error(
            'RapidAPI rate limit exceeded. Cached financial data may be available.'
          )
        )
      }

      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ETIMEDOUT')) {
        return err(new Error('RapidAPI network error - check internet connection'))
      }

      return err(new Error(`RapidAPIFinancialIntel query failed: ${errorMessage}`))
    }
  }

  /**
   * Health check - return true if API key configured
   */
  async healthCheck(): Promise<boolean> {
    return !this.degraded
  }

  /**
   * Disconnect - no-op for API adapter
   */
  async disconnect(): Promise<void> {
    console.log('[RapidAPIFinancialIntelAdapter] Disconnected')
  }

  /**
   * Orchestrate all API sources to build comprehensive PublicCompanyFinancials
   * Priority: Yahoo Finance symbol search → financials → SEC EDGAR filings → Real-Time Finance
   */
  private async fetchFinancials(companyName: string): Promise<PublicCompanyFinancials> {
    console.log(`[RapidAPIFinancialIntelAdapter] Fetching financials for "${companyName}"`)

    const enrichedAt = new Date().toISOString()

    // Step 1: Search Yahoo Finance for the stock symbol
    const symbol = await this.searchYahooSymbol(companyName)

    if (!symbol) {
      console.log(
        `[RapidAPIFinancialIntelAdapter] No public ticker found for "${companyName}" — returning isPublic: false`
      )
      return { companyName, isPublic: false, enrichedAt }
    }

    console.log(`[RapidAPIFinancialIntelAdapter] Found symbol "${symbol}" for "${companyName}"`)

    // Step 2: Fetch Yahoo Finance modules (financialData + defaultKeyStatistics)
    const yahooModules = await this.fetchYahooModules(symbol)

    // Step 3: Fetch SEC EDGAR filings (works for US-listed public companies)
    const secFilings = await this.fetchSecFilings(companyName)

    // Step 4: Fetch supplemental data from Real-Time Finance Data
    const rtData = await this.fetchRealTimeCompanyInfo(symbol)

    // Step 5: Fetch FMP income statement if Yahoo data is sparse
    let fmpData: FMPIncomeStatement[] = []
    const hasYahooRevenue = !!yahooModules?.body?.financialData?.totalRevenue?.raw
    if (!hasYahooRevenue) {
      fmpData = await this.fetchFMPIncomeStatements(symbol)
    }

    // Build unified result
    return this.buildFinancials(companyName, symbol, yahooModules, secFilings, rtData, fmpData, enrichedAt)
  }

  /**
   * 1. Yahoo Finance: search for ticker symbol
   * Host: yahoo-finance15.p.rapidapi.com
   */
  private async searchYahooSymbol(companyName: string): Promise<string | null> {
    try {
      const url = `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/search?search=${encodeURIComponent(companyName)}`

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey!,
        },
      })

      if (!response.ok) {
        if (response.status === 429) throw new Error('429 Rate limit exceeded')
        console.warn(`[RapidAPIFinancialIntelAdapter] Yahoo search HTTP ${response.status}`)
        return null
      }

      const data: YahooSearchResult = await response.json()
      const quotes = data.quotes || []

      // Prefer EQUITY instruments on major exchanges; skip ETFs, funds, indices
      const equity = quotes.find(
        (q) =>
          q.quoteType === 'EQUITY' &&
          q.symbol &&
          !q.symbol.includes('.') // Prefer primary US listings (no exchange suffix)
      )

      // Fallback: first equity even with exchange suffix (e.g., BT.L for BT Group)
      const fallback = quotes.find((q) => q.quoteType === 'EQUITY' && q.symbol)

      return equity?.symbol ?? fallback?.symbol ?? null
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('429')) throw error // Propagate rate limit
      console.warn(`[RapidAPIFinancialIntelAdapter] Yahoo symbol search failed: ${msg}`)
      return null
    }
  }

  /**
   * 2. Yahoo Finance: fetch financial modules for a ticker
   * Host: yahoo-finance15.p.rapidapi.com
   */
  private async fetchYahooModules(symbol: string): Promise<YahooModulesResult | null> {
    try {
      const modules = 'financialData,defaultKeyStatistics,earnings'
      const url = `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/modules?ticker=${encodeURIComponent(symbol)}&module=${modules}`

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey!,
        },
      })

      if (!response.ok) {
        if (response.status === 429) throw new Error('429 Rate limit exceeded')
        console.warn(`[RapidAPIFinancialIntelAdapter] Yahoo modules HTTP ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('429')) throw error
      console.warn(`[RapidAPIFinancialIntelAdapter] Yahoo modules fetch failed: ${msg}`)
      return null
    }
  }

  /**
   * 3. SEC EDGAR: fetch recent filings (10-K, 10-Q, 8-K)
   * Uses EDGAR full-text search (no API key required for the public endpoint,
   * but we also attempt the RapidAPI-hosted SEC EDGAR variant)
   */
  private async fetchSecFilings(
    companyName: string
  ): Promise<PublicCompanyFinancials['secFilings']> {
    // Try RapidAPI-hosted SEC EDGAR first
    const rapidapiFilings = await this.fetchSecEdgarRapidAPI(companyName)
    if (rapidapiFilings && rapidapiFilings.length > 0) {
      return rapidapiFilings
    }

    // Fallback: EDGAR full-text search (public, no key needed)
    return await this.fetchSecEdgarPublic(companyName)
  }

  /**
   * 3a. SEC EDGAR via RapidAPI
   * Host: sec-edgar1.p.rapidapi.com
   */
  private async fetchSecEdgarRapidAPI(
    companyName: string
  ): Promise<PublicCompanyFinancials['secFilings']> {
    try {
      const url =
        `https://sec-edgar1.p.rapidapi.com/company` +
        `?query=${encodeURIComponent(companyName)}` +
        `&category=form-type&dateRange=custom&startdt=2024-01-01&forms=10-K,10-Q,8-K`

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'sec-edgar1.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey!,
        },
      })

      if (!response.ok) {
        if (response.status === 429) throw new Error('429 Rate limit exceeded')
        // 404 / 403 just means this host variant isn't available — silently fall through
        return []
      }

      const data: SecEdgarResult = await response.json()
      return this.parseSecEdgarHits(data)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('429')) throw error
      console.warn(`[RapidAPIFinancialIntelAdapter] SEC EDGAR (RapidAPI) failed: ${msg}`)
      return []
    }
  }

  /**
   * 3b. SEC EDGAR via public EFTS endpoint (fallback, no API key needed)
   */
  private async fetchSecEdgarPublic(
    companyName: string
  ): Promise<PublicCompanyFinancials['secFilings']> {
    try {
      const url =
        `https://efts.sec.gov/LATEST/search-index` +
        `?q=${encodeURIComponent(`"${companyName}"`)}&dateRange=custom&startdt=2024-01-01&forms=10-K,10-Q,8-K`

      const response = await fetch(url, {
        headers: { 'User-Agent': 'Skyvera-Intelligence-Platform contact@skyvera.com' },
      })

      if (!response.ok) {
        console.warn(`[RapidAPIFinancialIntelAdapter] SEC EDGAR public HTTP ${response.status}`)
        return []
      }

      const data: SecEdgarResult = await response.json()
      return this.parseSecEdgarHits(data)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.warn(`[RapidAPIFinancialIntelAdapter] SEC EDGAR (public) failed: ${msg}`)
      return []
    }
  }

  /**
   * Parse SEC EDGAR hits into secFilings array
   */
  private parseSecEdgarHits(data: SecEdgarResult): PublicCompanyFinancials['secFilings'] {
    const hits = data.hits?.hits || []
    const filings: NonNullable<PublicCompanyFinancials['secFilings']> = []

    for (const hit of hits.slice(0, 10)) {
      const src = hit._source
      if (!src) continue

      const formType = src.form_type || 'Unknown'
      const date = src.file_date || src.display_date_filed || ''
      const description = src.entity_name
        ? `${formType} filed by ${src.entity_name}`
        : formType

      // Construct EDGAR filing URL from the document ID
      const hitId = hit._id || ''
      const url = hitId
        ? `https://www.sec.gov/Archives/edgar/data/${hitId}`
        : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=${formType}&dateb=&owner=include&count=10`

      filings.push({ type: formType, date, description, url })
    }

    return filings
  }

  /**
   * 4. Real-Time Finance Data: supplemental company info
   * Host: real-time-finance-data.p.rapidapi.com
   */
  private async fetchRealTimeCompanyInfo(symbol: string): Promise<RealTimeCompanyInfo | null> {
    try {
      const url = `https://real-time-finance-data.p.rapidapi.com/company-info?symbol=${encodeURIComponent(symbol)}&language=en`

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'real-time-finance-data.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey!,
        },
      })

      if (!response.ok) {
        if (response.status === 429) throw new Error('429 Rate limit exceeded')
        console.warn(`[RapidAPIFinancialIntelAdapter] Real-Time Finance HTTP ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('429')) throw error
      console.warn(`[RapidAPIFinancialIntelAdapter] Real-Time Finance fetch failed: ${msg}`)
      return null
    }
  }

  /**
   * 5. Financial Modeling Prep: income statement (fundamentals fallback)
   * Host: financial-modeling-prep.p.rapidapi.com
   */
  private async fetchFMPIncomeStatements(symbol: string): Promise<FMPIncomeStatement[]> {
    try {
      const url = `https://financial-modeling-prep.p.rapidapi.com/api/v3/income-statement/${encodeURIComponent(symbol)}?limit=4`

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'financial-modeling-prep.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey!,
        },
      })

      if (!response.ok) {
        if (response.status === 429) throw new Error('429 Rate limit exceeded')
        console.warn(`[RapidAPIFinancialIntelAdapter] FMP income statement HTTP ${response.status}`)
        return []
      }

      const data: FMPIncomeStatement[] = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('429')) throw error
      console.warn(`[RapidAPIFinancialIntelAdapter] FMP income statement fetch failed: ${msg}`)
      return []
    }
  }

  /**
   * Merge data from all sources into a unified PublicCompanyFinancials object
   */
  private buildFinancials(
    companyName: string,
    symbol: string,
    yahoo: YahooModulesResult | null,
    secFilings: PublicCompanyFinancials['secFilings'],
    rtData: RealTimeCompanyInfo | null,
    fmpData: FMPIncomeStatement[],
    enrichedAt: string
  ): PublicCompanyFinancials {
    const fd = yahoo?.body?.financialData
    const ks = yahoo?.body?.defaultKeyStatistics
    const rtd = rtData?.data

    // Revenue: Yahoo primary, Real-Time Finance secondary, FMP tertiary
    const annualRevenue =
      fd?.totalRevenue?.raw ??
      rtd?.revenue ??
      (fmpData[0]?.revenue ?? undefined)

    // Latest quarterly revenue from Yahoo earnings chart
    const quarterlyChart = yahoo?.body?.earnings?.financialsChart?.quarterly ?? []
    const latestQ = quarterlyChart[quarterlyChart.length - 1]

    // Revenue growth: Yahoo primary, FMP secondary
    const revenueGrowth =
      fd?.revenueGrowth?.raw != null
        ? fd.revenueGrowth.raw * 100
        : fmpData[0]?.revenueGrowth != null
          ? fmpData[0].revenueGrowth * 100
          : undefined

    // Analyst rating: normalize recommendationKey
    const recKey = fd?.recommendationKey?.toLowerCase()
    const analystRating = recKey
      ? ({
          strongbuy: 'Strong Buy',
          buy: 'Buy',
          hold: 'Hold',
          sell: 'Sell',
          strongsell: 'Strong Sell',
          none: undefined,
        }[recKey] ?? recKey)
      : undefined

    // Latest earnings quarter
    let latestEarnings: PublicCompanyFinancials['latestEarnings'] | undefined
    if (latestQ?.date) {
      latestEarnings = {
        quarter: latestQ.date,
        eps: ks?.trailingEps?.raw ?? rtd?.eps,
        revenueActual: latestQ.revenue?.raw,
        revenueSurprise: undefined, // Requires separate earnings-surprise endpoint
      }
    } else if (fmpData[0]) {
      latestEarnings = {
        quarter: fmpData[0].date ?? '',
        eps: fmpData[0].eps,
        revenueActual: fmpData[0].revenue,
        revenueSurprise: undefined,
      }
    }

    const result: PublicCompanyFinancials = {
      symbol,
      companyName,
      isPublic: true,
      marketCap: ks?.marketCap?.raw ?? rtd?.market_cap,
      revenue:
        annualRevenue != null || latestQ?.revenue?.raw != null
          ? {
              annual: annualRevenue,
              quarterly: latestQ?.revenue?.raw,
              currency: rtd?.currency ?? 'USD',
            }
          : undefined,
      revenueGrowth,
      profitMargin:
        fd?.profitMargins?.raw != null ? fd.profitMargins.raw * 100 : undefined,
      debtToEquity: fd?.debtToEquity?.raw,
      currentRatio: fd?.currentRatio?.raw,
      latestEarnings,
      secFilings: secFilings && secFilings.length > 0 ? secFilings : undefined,
      analystRating: analystRating as string | undefined,
      priceTarget: fd?.targetMeanPrice?.raw,
      enrichedAt,
    }

    console.log(
      `[RapidAPIFinancialIntelAdapter] Built financials for "${companyName}" (${symbol}) — ` +
        `isPublic: true, marketCap: ${result.marketCap ?? 'n/a'}, ` +
        `annualRevenue: ${result.revenue?.annual ?? 'n/a'}, ` +
        `revenueGrowth: ${result.revenueGrowth != null ? result.revenueGrowth.toFixed(1) + '%' : 'n/a'}`
    )

    return result
  }

  /**
   * Get adapter status
   */
  getStatus() {
    return {
      connected: !this.degraded,
      degraded: this.degraded,
      apiKeyConfigured: !!this.apiKey,
    }
  }
}
