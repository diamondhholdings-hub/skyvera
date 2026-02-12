/**
 * NewsAPIAdapter - integrates with NewsAPI.ai for business intelligence
 * Caches aggressively to stay within 100 req/day free tier
 */

import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'
import { NewsArticleSchema, type NewsArticle } from '@/lib/types/news'
import { getCacheManager, CACHE_TTL } from '@/lib/cache/manager'

/**
 * NewsAPI.ai response structure
 */
interface NewsAPIResponse {
  articles?: {
    results?: Array<{
      title?: string
      body?: string
      dateTime?: string
      source?: { title?: string }
      url?: string
    }>
  }
  error?: string
}

/**
 * NewsAPIAdapter - fetches business intelligence from NewsAPI.ai
 */
export class NewsAPIAdapter implements DataAdapter {
  name = 'newsapi'

  private apiKey: string | undefined
  private apiEndpoint = 'https://eventregistry.org/api/v1/article/getArticles'
  private cache = getCacheManager()
  private degraded = false // Adapter is degraded if API key missing (not failed)

  constructor() {
    this.apiKey = process.env.NEWSAPI_KEY
  }

  /**
   * Connect: Verify API key exists
   */
  async connect(): Promise<Result<void, Error>> {
    if (!this.apiKey) {
      console.warn('[NewsAPIAdapter] NEWSAPI_KEY not configured - adapter running in degraded mode')
      this.degraded = true
      return ok(undefined) // Not a failure, just degraded
    }

    console.log('[NewsAPIAdapter] Connected successfully')
    this.degraded = false
    return ok(undefined)
  }

  /**
   * Query news articles for a customer
   */
  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    if (query.type !== 'news') {
      return err(new Error(`NewsAPI adapter only supports type 'news', got '${query.type}'`))
    }

    if (!query.filters?.customerName) {
      return err(new Error('NewsAPI query requires filters.customerName'))
    }

    if (this.degraded) {
      return err(new Error('NEWSAPI_KEY not configured - cannot fetch news'))
    }

    const customerName = query.filters.customerName
    const limit = query.filters.limit || 5

    // Check cache first
    const cacheKey = `news:${customerName}:${limit}`

    try {
      const articles = await this.cache.get(
        cacheKey,
        async () => {
          return await this.fetchArticles(customerName, limit)
        },
        { ttl: CACHE_TTL.NEWS, jitter: true }
      )

      return ok({
        data: articles,
        source: this.name,
        timestamp: new Date(),
        count: articles.length,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Check for rate limit
      if (errorMessage.includes('429')) {
        return err(
          new Error(
            'NewsAPI rate limit exceeded (100 req/day). Cached data may be available.'
          )
        )
      }

      // Network error
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ETIMEDOUT')) {
        return err(new Error('NewsAPI network error - check internet connection'))
      }

      return err(new Error(`NewsAPI query failed: ${errorMessage}`))
    }
  }

  /**
   * Health check - return true if API key configured
   */
  async healthCheck(): Promise<boolean> {
    // Degraded mode is still "healthy" - just limited functionality
    return true
  }

  /**
   * Disconnect - no-op for API adapter
   */
  async disconnect(): Promise<void> {
    console.log('[NewsAPIAdapter] Disconnected')
  }

  /**
   * Fetch articles from NewsAPI.ai
   */
  private async fetchArticles(customerName: string, limit: number): Promise<NewsArticle[]> {
    const requestBody = {
      keyword: customerName,
      lang: 'eng',
      articlesCount: limit,
      articlesSortBy: 'date',
      apiKey: this.apiKey,
    }

    console.log(`[NewsAPIAdapter] Fetching ${limit} articles for "${customerName}"`)

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('429 Rate limit exceeded')
      }
      throw new Error(`NewsAPI HTTP ${response.status}: ${response.statusText}`)
    }

    const data: NewsAPIResponse = await response.json()

    if (data.error) {
      throw new Error(`NewsAPI error: ${data.error}`)
    }

    // Transform NewsAPI response to our NewsArticle schema
    const articles: NewsArticle[] = []

    const rawArticles = data.articles?.results || []

    for (const article of rawArticles) {
      if (!article.title || !article.url) {
        continue // Skip incomplete articles
      }

      const newsArticle = {
        title: article.title,
        summary: article.body?.substring(0, 500) || '', // Truncate to 500 chars
        publishedAt: article.dateTime || new Date().toISOString(),
        source: article.source?.title || 'Unknown',
        url: article.url,
        sentiment: undefined, // Will be enriched by Claude in intelligence layer
        relevanceScore: undefined, // Will be calculated by Claude
      }

      // Validate against schema
      const validationResult = NewsArticleSchema.safeParse(newsArticle)

      if (validationResult.success) {
        articles.push(validationResult.data)
      } else {
        console.warn('[NewsAPIAdapter] Article validation failed:', validationResult.error)
      }
    }

    console.log(`[NewsAPIAdapter] Fetched and validated ${articles.length} articles`)

    return articles
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
