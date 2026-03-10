/**
 * HiringSignalsAdapter - integrates with RapidAPI job boards to derive hiring velocity signals
 * Hiring velocity is a leading indicator for B2B SaaS churn/expansion:
 *   - Scaling up hiring (product/engineering/sales) → expansion signal
 *   - Mass layoffs or zero postings → churn risk signal
 *   - Hiring CS roles that use Skyvera products → engagement signal
 *
 * Caches aggressively — job data changes slowly and API quotas are limited.
 */

import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager, CACHE_TTL } from '@/lib/cache/manager'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface HiringSignal {
  companyName: string
  totalOpenRoles: number
  recentPostings30d: number // jobs posted in last 30 days
  hiringVelocityTrend: 'growing' | 'stable' | 'declining' | 'unknown'
  keyDepartmentsHiring: string[] // e.g. ["Engineering", "Sales", "Customer Success"]
  topRoles: Array<{
    title: string
    department?: string
    location?: string
    postedDate?: string
  }>
  layoffSignals: boolean // true if recent layoff news detected in titles
  csHiring: boolean // hiring Customer Success = engagement signal
  techHiring: boolean // hiring engineers = platform expansion signal
  enrichedAt: string
}

// ---------------------------------------------------------------------------
// Internal normalised job shape (lowest common denominator across all APIs)
// ---------------------------------------------------------------------------

interface NormalisedJob {
  title: string
  location?: string
  postedDate?: string
}

// ---------------------------------------------------------------------------
// Raw API response shapes
// ---------------------------------------------------------------------------

interface JSearchJob {
  job_title?: string
  job_city?: string
  job_state?: string
  job_country?: string
  job_posted_at_datetime_utc?: string
}

interface JSearchResponse {
  data?: JSearchJob[]
  status?: string
  error?: string
}

interface LinkedInJob {
  title?: string
  location?: string
  postedDate?: string
  date?: string
}

interface JobPostingFeedJob {
  title?: string
  job_title?: string
  location?: string
  date_posted?: string
}

interface IndeedJob {
  title?: string
  location?: string
  date?: string
}

interface ActiveJobsJob {
  title?: string
  job_title?: string
  location?: string
  date_posted?: string
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class HiringSignalsAdapter implements DataAdapter {
  name = 'rapidapi-hiring-signals'

  private apiKey: string | undefined
  private cache = getCacheManager()
  private degraded = false // Adapter is degraded if API key missing (not failed)

  // RapidAPI hosts
  private readonly jsearchHost = 'jsearch.p.rapidapi.com'
  private readonly linkedinHost = 'linkedin-jobs-search.p.rapidapi.com'
  private readonly jobFeedHost = 'job-posting-feed-api.p.rapidapi.com'
  private readonly indeedHost = 'indeed-scraper-api.p.rapidapi.com'
  private readonly activeJobsHost = 'active-jobs-db.p.rapidapi.com'

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY
  }

  // -------------------------------------------------------------------------
  // DataAdapter interface
  // -------------------------------------------------------------------------

  /**
   * Connect: Verify API key exists
   */
  async connect(): Promise<Result<void, Error>> {
    if (!this.apiKey) {
      console.warn(
        '[HiringSignalsAdapter] RAPIDAPI_KEY not configured - adapter running in degraded mode'
      )
      this.degraded = true
      return ok(undefined) // Not a failure, just degraded
    }

    console.log('[HiringSignalsAdapter] Connected successfully')
    this.degraded = false
    return ok(undefined)
  }

  /**
   * Query hiring signals for a customer company
   */
  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    if (query.type !== 'customers') {
      return err(
        new Error(
          `HiringSignals adapter only supports type 'customers', got '${query.type}'`
        )
      )
    }

    if (!query.filters?.customerName) {
      return err(new Error('HiringSignals query requires filters.customerName'))
    }

    if (this.degraded) {
      return err(new Error('RAPIDAPI_KEY not configured - cannot fetch hiring signals'))
    }

    const companyName = query.filters.customerName

    // Check cache first
    const cacheKey = `hiring-signals:${companyName.toLowerCase()}`

    try {
      const signal = await this.cache.get(
        cacheKey,
        async () => {
          return await this.fetchHiringSignal(companyName)
        },
        { ttl: CACHE_TTL.CUSTOMER_DATA, jitter: true }
      )

      return ok({
        data: [signal],
        source: this.name,
        timestamp: new Date(),
        count: 1,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Check for rate limit
      if (errorMessage.includes('429')) {
        return err(
          new Error(
            'RapidAPI rate limit exceeded. Cached data may be available.'
          )
        )
      }

      // Network error
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ETIMEDOUT')) {
        return err(new Error('RapidAPI network error - check internet connection'))
      }

      return err(new Error(`HiringSignals query failed: ${errorMessage}`))
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
    console.log('[HiringSignalsAdapter] Disconnected')
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

  // -------------------------------------------------------------------------
  // Core fetch + signal derivation
  // -------------------------------------------------------------------------

  /**
   * Fetch jobs from all sources (priority order) and derive a HiringSignal
   */
  private async fetchHiringSignal(companyName: string): Promise<HiringSignal> {
    console.log(`[HiringSignalsAdapter] Fetching hiring signals for "${companyName}"`)

    // Fetch from all sources concurrently; individual source failures are tolerated
    const [jsearchJobs, linkedinJobs, jobFeedJobs, indeedJobs, activeJobs] =
      await Promise.allSettled([
        this.fetchFromJSearch(companyName),
        this.fetchFromLinkedIn(companyName),
        this.fetchFromJobPostingFeed(companyName),
        this.fetchFromIndeed(companyName),
        this.fetchFromActiveJobs(companyName),
      ])

    // Merge all successful results, deduplicate by normalised title
    const allJobs: NormalisedJob[] = []

    for (const result of [jsearchJobs, linkedinJobs, jobFeedJobs, indeedJobs, activeJobs]) {
      if (result.status === 'fulfilled') {
        allJobs.push(...result.value)
      }
    }

    const deduped = this.deduplicateJobs(allJobs)

    console.log(
      `[HiringSignalsAdapter] Merged ${allJobs.length} raw jobs → ${deduped.length} deduplicated for "${companyName}"`
    )

    return this.deriveSignal(companyName, deduped)
  }

  // -------------------------------------------------------------------------
  // API source fetchers
  // -------------------------------------------------------------------------

  /**
   * 1. JSearch — primary source (already 20% quota used, known working)
   */
  private async fetchFromJSearch(companyName: string): Promise<NormalisedJob[]> {
    const url = new URL('https://jsearch.p.rapidapi.com/search')
    url.searchParams.set('query', `${companyName} jobs`)
    url.searchParams.set('page', '1')
    url.searchParams.set('num_pages', '2')
    url.searchParams.set('country', 'us')
    url.searchParams.set('date_posted', 'month')

    const response = await this.rapidApiFetch(url.toString(), this.jsearchHost)

    const data: JSearchResponse = await response.json()

    if (data.error) {
      throw new Error(`JSearch error: ${data.error}`)
    }

    const jobs = data.data || []

    return jobs
      .filter((j): j is JSearchJob & { job_title: string } => !!j.job_title)
      .map((j) => ({
        title: j.job_title,
        location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
        postedDate: j.job_posted_at_datetime_utc,
      }))
  }

  /**
   * 2. LinkedIn Jobs Search — supplement
   */
  private async fetchFromLinkedIn(companyName: string): Promise<NormalisedJob[]> {
    const url = new URL('https://linkedin-jobs-search.p.rapidapi.com/')
    url.searchParams.set('keywords', companyName)
    url.searchParams.set('location', 'Worldwide')
    url.searchParams.set('dateSincePosted', 'past%20month')
    url.searchParams.set('limit', '25')

    const response = await this.rapidApiFetch(url.toString(), this.linkedinHost)
    const data: LinkedInJob[] = await response.json()

    if (!Array.isArray(data)) return []

    return data
      .filter((j): j is LinkedInJob & { title: string } => !!j.title)
      .map((j) => ({
        title: j.title,
        location: j.location,
        postedDate: j.postedDate ?? j.date,
      }))
  }

  /**
   * 3. Job Posting Feed API — supplement
   */
  private async fetchFromJobPostingFeed(companyName: string): Promise<NormalisedJob[]> {
    const url = new URL('https://job-posting-feed-api.p.rapidapi.com/jobs')
    url.searchParams.set('keyword', companyName)
    url.searchParams.set('limit', '20')

    const response = await this.rapidApiFetch(url.toString(), this.jobFeedHost)
    const data: { jobs?: JobPostingFeedJob[] } | JobPostingFeedJob[] = await response.json()

    const jobs: JobPostingFeedJob[] = Array.isArray(data)
      ? data
      : (data as { jobs?: JobPostingFeedJob[] }).jobs || []

    return jobs
      .filter((j) => !!(j.title ?? j.job_title))
      .map((j) => ({
        title: (j.title ?? j.job_title)!,
        location: j.location,
        postedDate: j.date_posted,
      }))
  }

  /**
   * 4. Indeed Scraper API — fallback
   */
  private async fetchFromIndeed(companyName: string): Promise<NormalisedJob[]> {
    const url = new URL('https://indeed-scraper-api.p.rapidapi.com/search')
    url.searchParams.set('query', companyName)
    url.searchParams.set('location', '')
    url.searchParams.set('radius', '50')
    url.searchParams.set('sort', 'date')
    url.searchParams.set('limit', '15')

    const response = await this.rapidApiFetch(url.toString(), this.indeedHost)
    const data: { results?: IndeedJob[] } | IndeedJob[] = await response.json()

    const jobs: IndeedJob[] = Array.isArray(data)
      ? data
      : (data as { results?: IndeedJob[] }).results || []

    return jobs
      .filter((j): j is IndeedJob & { title: string } => !!j.title)
      .map((j) => ({
        title: j.title,
        location: j.location,
        postedDate: j.date,
      }))
  }

  /**
   * 5. Active Jobs DB — supplement for tech roles
   */
  private async fetchFromActiveJobs(companyName: string): Promise<NormalisedJob[]> {
    const url = new URL('https://active-jobs-db.p.rapidapi.com/get-jobs-details')
    url.searchParams.set('title', companyName)
    url.searchParams.set('location', '')
    url.searchParams.set('empType', '')
    url.searchParams.set('expLevel', '')

    const response = await this.rapidApiFetch(url.toString(), this.activeJobsHost)
    const data: { jobs?: ActiveJobsJob[] } | ActiveJobsJob[] = await response.json()

    const jobs: ActiveJobsJob[] = Array.isArray(data)
      ? data
      : (data as { jobs?: ActiveJobsJob[] }).jobs || []

    return jobs
      .filter((j) => !!(j.title ?? j.job_title))
      .map((j) => ({
        title: (j.title ?? j.job_title)!,
        location: j.location,
        postedDate: j.date_posted,
      }))
  }

  // -------------------------------------------------------------------------
  // Signal derivation
  // -------------------------------------------------------------------------

  /**
   * Derive a HiringSignal from the merged, deduplicated job list
   */
  private deriveSignal(companyName: string, jobs: NormalisedJob[]): HiringSignal {
    const totalOpenRoles = jobs.length

    // recentPostings30d: jobs with a parseable postedDate within the last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const recentPostings30d = jobs.filter((j) => {
      if (!j.postedDate) return true // treat unknown dates as recent (we filtered for 'month' already)
      const posted = new Date(j.postedDate).getTime()
      return !isNaN(posted) && posted >= thirtyDaysAgo
    }).length

    // Velocity trend: based on 30-day count (no historical baseline available)
    let hiringVelocityTrend: HiringSignal['hiringVelocityTrend'] = 'unknown'
    if (totalOpenRoles > 0) {
      if (recentPostings30d > 20) {
        hiringVelocityTrend = 'growing'
      } else if (recentPostings30d >= 5) {
        hiringVelocityTrend = 'stable'
      } else {
        hiringVelocityTrend = 'declining'
      }
    }

    // Signal flags
    const csHiring = jobs.some((j) =>
      /customer success|account manager|\bcsm\b|customer experience/i.test(j.title)
    )
    const techHiring = jobs.some((j) =>
      /engineer|developer|architect|devops|\bsre\b/i.test(j.title)
    )
    const layoffSignals = jobs.some((j) =>
      /layoff|redundan|restructur/i.test(j.title)
    )

    // Key departments from job titles
    const departmentSet = new Set(
      jobs.map((j) => this.inferDepartment(j.title)).filter((d): d is string => !!d)
    )
    const keyDepartmentsHiring = [...departmentSet]

    // Top roles: first 10 unique titles with metadata
    const topRoles = jobs.slice(0, 10).map((j) => ({
      title: j.title,
      department: this.inferDepartment(j.title) ?? undefined,
      location: j.location || undefined,
      postedDate: j.postedDate || undefined,
    }))

    return {
      companyName,
      totalOpenRoles,
      recentPostings30d,
      hiringVelocityTrend,
      keyDepartmentsHiring,
      topRoles,
      layoffSignals,
      csHiring,
      techHiring,
      enrichedAt: new Date().toISOString(),
    }
  }

  /**
   * Infer a department label from a job title
   */
  private inferDepartment(title: string): string | null {
    if (/engineer|developer|architect|devops|\bsre\b|data scientist|ml |machine learning/i.test(title)) {
      return 'Engineering'
    }
    if (/product manager|product owner|ux|ui designer|designer/i.test(title)) {
      return 'Product'
    }
    if (/sales|account executive|business development|\bae\b|\bbdr\b|\bsdr\b/i.test(title)) {
      return 'Sales'
    }
    if (/customer success|account manager|\bcsm\b|customer experience|customer support/i.test(title)) {
      return 'Customer Success'
    }
    if (/marketing|growth|demand gen|content|seo|brand/i.test(title)) {
      return 'Marketing'
    }
    if (/finance|accounting|controller|fp&a|analyst/i.test(title)) {
      return 'Finance'
    }
    if (/hr|human resources|recruiter|talent|people ops/i.test(title)) {
      return 'People & HR'
    }
    if (/legal|counsel|compliance|privacy/i.test(title)) {
      return 'Legal'
    }
    if (/operations|ops|program manager|project manager|chief of staff/i.test(title)) {
      return 'Operations'
    }
    if (/support|help desk|technical support|implementation/i.test(title)) {
      return 'Support'
    }
    return null
  }

  // -------------------------------------------------------------------------
  // Shared RapidAPI fetch helper
  // -------------------------------------------------------------------------

  /**
   * Issue a GET request with RapidAPI headers; throws on non-OK HTTP status
   */
  private async rapidApiFetch(url: string, host: string): Promise<Response> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': host,
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`429 Rate limit exceeded on host ${host}`)
      }
      throw new Error(`RapidAPI HTTP ${response.status} from ${host}: ${response.statusText}`)
    }

    return response
  }

  // -------------------------------------------------------------------------
  // Deduplication
  // -------------------------------------------------------------------------

  /**
   * Deduplicate jobs by normalised title (lowercase, stripped punctuation)
   * Retains the first occurrence (JSearch is highest-priority source)
   */
  private deduplicateJobs(jobs: NormalisedJob[]): NormalisedJob[] {
    const seen = new Set<string>()
    return jobs.filter((j) => {
      const key = j.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}
