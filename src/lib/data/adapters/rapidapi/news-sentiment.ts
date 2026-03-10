/**
 * RapidAPINewsSentimentAdapter - fetches financial news with sentiment scoring from RapidAPI
 * Aggregates from Reuters, Real-Time News, Financial & Business News, and BizToc.
 * Scores top articles via Finance Text Sentiment API.
 * Caches aggressively at 30-minute TTL to stay within RapidAPI rate limits.
 */

import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager, CACHE_TTL } from '@/lib/cache/manager'

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface SentimentNewsArticle {
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentScore: number // -1.0 to 1.0
  relevanceScore?: number
  topics?: string[]
}

// ---------------------------------------------------------------------------
// RapidAPI response shapes (inline – no external schema dependency)
// ---------------------------------------------------------------------------

/** Reuters Business and Financial News */
interface ReutersArticleRaw {
  articlesName?: string
  articlesShortDescription?: string
  articleUrl?: string
  publishedAt?: string
  sourceName?: string
  keyWordsTag?: string[]
}

interface ReutersResponse {
  articles?: ReutersArticleRaw[]
  message?: string
}

/** Real-Time News Data */
interface RealTimeArticleRaw {
  title?: string
  snippet?: string
  url?: string
  source_name?: string
  published_datetime_utc?: string
  topics?: string[]
}

interface RealTimeResponse {
  data?: RealTimeArticleRaw[]
  status?: string
}

/** Financial & Business News */
interface FinBizArticleRaw {
  title?: string
  description?: string
  url?: string
  source?: string
  publishedAt?: string
}

interface FinBizResponse {
  news?: FinBizArticleRaw[]
  error?: string
}

/** BizToc fallback */
interface BizTocArticleRaw {
  title?: string
  body?: string
  url?: string
  domain?: string
  published?: string
  tags?: string[]
}

/** Finance Text Sentiment */
interface SentimentResponse {
  sentiment?: 'positive' | 'negative' | 'neutral'
  score?: number
}

// ---------------------------------------------------------------------------
// Normalised intermediate shape before sentiment enrichment
// ---------------------------------------------------------------------------

interface RawArticle {
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  topics?: string[]
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

const NEWS_SENTIMENT_TTL = 1800 // 30 minutes, overriding the default CACHE_TTL.NEWS
const TOP_ARTICLES_TO_SCORE = 5 // Limit sentiment API calls to top N articles

export class RapidAPINewsSentimentAdapter implements DataAdapter {
  name = 'rapidapi-news-sentiment'

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
        '[RapidAPINewsSentimentAdapter] RAPIDAPI_KEY not configured - adapter running in degraded mode'
      )
      this.degraded = true
      return ok(undefined) // Not a failure, just degraded
    }

    console.log('[RapidAPINewsSentimentAdapter] Connected successfully')
    this.degraded = false
    return ok(undefined)
  }

  /**
   * Query news articles with sentiment for a given customer name.
   */
  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    if (query.type !== 'news') {
      return err(
        new Error(
          `RapidAPI News Sentiment adapter only supports type 'news', got '${query.type}'`
        )
      )
    }

    if (!query.filters?.customerName) {
      return err(new Error('RapidAPI News Sentiment query requires filters.customerName'))
    }

    if (this.degraded) {
      return err(new Error('RAPIDAPI_KEY not configured - cannot fetch news sentiment'))
    }

    const customerName = query.filters.customerName
    const cacheKey = `rapidapi-news-sentiment:${customerName}`

    try {
      const articles = await this.cache.get(
        cacheKey,
        async () => {
          return await this.fetchAndScore(customerName)
        },
        { ttl: NEWS_SENTIMENT_TTL, jitter: true }
      )

      return ok({
        data: articles,
        source: this.name,
        timestamp: new Date(),
        count: articles.length,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (errorMessage.includes('429')) {
        return err(
          new Error(
            'RapidAPI rate limit exceeded. Cached data may be available.'
          )
        )
      }

      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ETIMEDOUT')) {
        return err(new Error('RapidAPI network error - check internet connection'))
      }

      return err(new Error(`RapidAPI News Sentiment query failed: ${errorMessage}`))
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
    console.log('[RapidAPINewsSentimentAdapter] Disconnected')
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
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Fetch from all three primary sources in parallel, deduplicate, sort, and
   * call the sentiment API for the top N articles.
   */
  private async fetchAndScore(companyName: string): Promise<SentimentNewsArticle[]> {
    console.log(`[RapidAPINewsSentimentAdapter] Fetching news for "${companyName}"`)

    // Fetch all sources in parallel; individual failures return empty arrays
    const [reutersArticles, realTimeArticles, finBizArticles, bizTocArticles] =
      await Promise.allSettled([
        this.fetchReuters(companyName),
        this.fetchRealTime(companyName),
        this.fetchFinBiz(companyName),
        this.fetchBizToc(companyName),
      ]).then((results) =>
        results.map((r) => (r.status === 'fulfilled' ? r.value : []))
      )

    // Merge & deduplicate by URL
    const seen = new Set<string>()
    const merged: RawArticle[] = []

    for (const article of [
      ...reutersArticles,
      ...realTimeArticles,
      ...finBizArticles,
      ...bizTocArticles,
    ]) {
      if (!article.url || seen.has(article.url)) continue
      seen.add(article.url)
      merged.push(article)
    }

    // Sort by publishedAt descending (newest first)
    merged.sort((a, b) => {
      const ta = new Date(a.publishedAt).getTime()
      const tb = new Date(b.publishedAt).getTime()
      return tb - ta
    })

    const top10 = merged.slice(0, 10)

    // Score top N via Finance Text Sentiment API
    const scored = await this.scoreArticles(top10)

    console.log(
      `[RapidAPINewsSentimentAdapter] Returning ${scored.length} articles for "${companyName}"`
    )

    return scored
  }

  // -------------------------------------------------------------------------
  // Source 1: Reuters Business and Financial News
  // -------------------------------------------------------------------------

  private async fetchReuters(keyword: string): Promise<RawArticle[]> {
    const encodedKeyword = encodeURIComponent(keyword)
    const url = `https://reuters-business-and-financial-news.p.rapidapi.com/get-articles-by-keyword-name/${encodedKeyword}/0/10`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'reuters-business-and-financial-news.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`Reuters API HTTP ${response.status}: ${response.statusText}`)
    }

    const data: ReutersResponse = await response.json()
    const articles: RawArticle[] = []

    for (const item of data.articles ?? []) {
      if (!item.articlesName || !item.articleUrl) continue
      articles.push({
        title: item.articlesName,
        summary: item.articlesShortDescription?.substring(0, 500) ?? '',
        url: item.articleUrl,
        source: item.sourceName ?? 'Reuters',
        publishedAt: item.publishedAt ?? new Date().toISOString(),
        topics: item.keyWordsTag,
      })
    }

    return articles
  }

  // -------------------------------------------------------------------------
  // Source 2: Real-Time News Data
  // -------------------------------------------------------------------------

  private async fetchRealTime(companyName: string): Promise<RawArticle[]> {
    const params = new URLSearchParams({
      query: companyName,
      limit: '10',
      country: 'US',
      lang: 'en',
    })
    const url = `https://real-time-news-data.p.rapidapi.com/search?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'real-time-news-data.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`Real-Time News API HTTP ${response.status}: ${response.statusText}`)
    }

    const data: RealTimeResponse = await response.json()
    const articles: RawArticle[] = []

    for (const item of data.data ?? []) {
      if (!item.title || !item.url) continue
      articles.push({
        title: item.title,
        summary: item.snippet?.substring(0, 500) ?? '',
        url: item.url,
        source: item.source_name ?? 'Real-Time News',
        publishedAt: item.published_datetime_utc ?? new Date().toISOString(),
        topics: item.topics,
      })
    }

    return articles
  }

  // -------------------------------------------------------------------------
  // Source 3: Financial & Business News API
  // -------------------------------------------------------------------------

  private async fetchFinBiz(companyName: string): Promise<RawArticle[]> {
    const params = new URLSearchParams({
      company: companyName,
      limit: '5',
    })
    const url = `https://financial-and-business-news.p.rapidapi.com/news/company?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'financial-and-business-news.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`Financial & Business News API HTTP ${response.status}: ${response.statusText}`)
    }

    const data: FinBizResponse = await response.json()

    if (data.error) {
      throw new Error(`Financial & Business News API error: ${data.error}`)
    }

    const articles: RawArticle[] = []

    for (const item of data.news ?? []) {
      if (!item.title || !item.url) continue
      articles.push({
        title: item.title,
        summary: item.description?.substring(0, 500) ?? '',
        url: item.url,
        source: item.source ?? 'Financial & Business News',
        publishedAt: item.publishedAt ?? new Date().toISOString(),
      })
    }

    return articles
  }

  // -------------------------------------------------------------------------
  // Source 5: BizToc fallback
  // -------------------------------------------------------------------------

  private async fetchBizToc(companyName: string): Promise<RawArticle[]> {
    const params = new URLSearchParams({ q: companyName })
    const url = `https://biztoc.p.rapidapi.com/search?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.apiKey!,
        'X-RapidAPI-Host': 'biztoc.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      if (response.status === 429) throw new Error('429 Rate limit exceeded')
      throw new Error(`BizToc API HTTP ${response.status}: ${response.statusText}`)
    }

    const data: BizTocArticleRaw[] = await response.json()
    const articles: RawArticle[] = []

    for (const item of data ?? []) {
      if (!item.title || !item.url) continue
      articles.push({
        title: item.title,
        summary: item.body?.substring(0, 500) ?? '',
        url: item.url,
        source: item.domain ?? 'BizToc',
        publishedAt: item.published ?? new Date().toISOString(),
        topics: item.tags,
      })
    }

    return articles
  }

  // -------------------------------------------------------------------------
  // Source 4: Finance Text Sentiment (scoring)
  // -------------------------------------------------------------------------

  /**
   * Score the top N articles; assign neutral (0) for any that fail or for
   * articles beyond the scoring window.
   */
  private async scoreArticles(articles: RawArticle[]): Promise<SentimentNewsArticle[]> {
    const toScore = articles.slice(0, TOP_ARTICLES_TO_SCORE)
    const rest = articles.slice(TOP_ARTICLES_TO_SCORE)

    // Fire sentiment requests for the top slice in parallel
    const sentimentResults = await Promise.allSettled(
      toScore.map((a) => this.fetchSentiment(`${a.title}. ${a.summary}`))
    )

    const scored: SentimentNewsArticle[] = toScore.map((article, i) => {
      const result = sentimentResults[i]
      const sentiment =
        result.status === 'fulfilled' ? result.value : null

      return {
        title: article.title,
        summary: article.summary,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
        sentiment: sentiment?.sentiment ?? 'neutral',
        sentimentScore: sentiment?.score ?? 0,
        topics: article.topics,
      }
    })

    // Append unscored articles with neutral defaults
    const unscored: SentimentNewsArticle[] = rest.map((article) => ({
      title: article.title,
      summary: article.summary,
      url: article.url,
      source: article.source,
      publishedAt: article.publishedAt,
      sentiment: 'neutral' as const,
      sentimentScore: 0,
      topics: article.topics,
    }))

    return [...scored, ...unscored]
  }

  /**
   * Call Finance Text Sentiment API for a single piece of text.
   * Returns null on any failure so callers can fall back to neutral.
   */
  private async fetchSentiment(
    text: string
  ): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number } | null> {
    try {
      const response = await fetch(
        'https://finance-text-sentiment-analysis.p.rapidapi.com/sentiment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.apiKey!,
            'X-RapidAPI-Host': 'finance-text-sentiment-analysis.p.rapidapi.com',
          },
          body: JSON.stringify({ text }),
        }
      )

      if (!response.ok) {
        console.warn(
          `[RapidAPINewsSentimentAdapter] Sentiment API HTTP ${response.status} - defaulting to neutral`
        )
        return null
      }

      const data: SentimentResponse = await response.json()

      if (!data.sentiment) return null

      return {
        sentiment: data.sentiment,
        score: data.score ?? 0,
      }
    } catch (error) {
      console.warn(
        '[RapidAPINewsSentimentAdapter] Sentiment API unavailable - defaulting to neutral:',
        error
      )
      return null
    }
  }
}
