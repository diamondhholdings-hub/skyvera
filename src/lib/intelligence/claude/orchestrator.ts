/**
 * ClaudeOrchestrator - Central Claude API gateway
 * Handles request routing, priority queue, rate limiting, response caching, and error handling
 */

import Anthropic from '@anthropic-ai/sdk'
import { CacheManager, CACHE_TTL } from '@/lib/cache/manager'
import { ClaudeRateLimiter } from './rate-limiter'
import { Result, ok, err } from '@/lib/types/result'

export interface ClaudeRequest {
  prompt: string
  systemPrompt?: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  context?: Record<string, unknown>
  maxTokens?: number
  temperature?: number
  cacheKey?: string // Custom cache key, defaults to prompt hash
}

export interface ClaudeResponse {
  content: string
  model: string
  inputTokens: number
  outputTokens: number
  cached: boolean
}

interface QueuedRequest {
  request: ClaudeRequest
  resolve: (value: Result<ClaudeResponse>) => void
  reject: (error: Error) => void
}

interface RequestStats {
  totalRequests: number
  cacheHits: number
  apiCalls: number
  errors: number
  totalLatencyMs: number
}

export class ClaudeOrchestrator {
  private client: Anthropic | null = null
  private cache: CacheManager
  private rateLimiter: ClaudeRateLimiter
  private queue: QueuedRequest[] = []
  private processing = false
  private stats: RequestStats = {
    totalRequests: 0,
    cacheHits: 0,
    apiCalls: 0,
    errors: 0,
    totalLatencyMs: 0,
  }

  constructor(cache: CacheManager) {
    // Check for ANTHROPIC_API_KEY, if missing log warning but don't crash
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn(
        'ANTHROPIC_API_KEY not configured. Claude API requests will fail. Set the key in .env.local'
      )
    } else {
      this.client = new Anthropic({ apiKey })
    }

    this.cache = cache
    this.rateLimiter = new ClaudeRateLimiter()
  }

  /**
   * Process a Claude API request with caching and rate limiting
   */
  async processRequest(
    request: ClaudeRequest
  ): Promise<Result<ClaudeResponse>> {
    this.stats.totalRequests++
    const startTime = Date.now()

    try {
      // Generate cache key
      const cacheKey =
        request.cacheKey ||
        `claude:${this.hashPrompt(request.prompt + (request.systemPrompt || ''))}`

      // Check cache
      const ttl =
        request.priority === 'HIGH'
          ? CACHE_TTL.CLAUDE_RESPONSE
          : CACHE_TTL.CLAUDE_ENRICHMENT

      const cachedEntry = this.cache.getWithMetadata<ClaudeResponse>(cacheKey)
      if (cachedEntry) {
        this.stats.cacheHits++
        this.stats.totalLatencyMs += Date.now() - startTime
        return ok({ ...cachedEntry.value, cached: true })
      }

      // Enqueue by priority
      const result = await this.enqueueRequest(request)

      this.stats.totalLatencyMs += Date.now() - startTime

      // Cache successful responses
      if (result.success) {
        this.cache.set(cacheKey, result.value, { ttl })
      }

      return result
    } catch (error) {
      this.stats.errors++
      this.stats.totalLatencyMs += Date.now() - startTime
      return err(
        error instanceof Error ? error : new Error('Unknown error occurred')
      )
    }
  }

  /**
   * Process request with semantic context auto-injection
   */
  async processRequestWithSemanticContext(
    request: ClaudeRequest,
    metricNames?: string[]
  ): Promise<Result<ClaudeResponse>> {
    // For now, just pass through. Will be enhanced when prompts/system.ts is created
    return this.processRequest(request)
  }

  /**
   * Process multiple requests respecting rate limits
   */
  async batchProcess(
    requests: ClaudeRequest[]
  ): Promise<Map<string, Result<ClaudeResponse>>> {
    const results = new Map<string, Result<ClaudeResponse>>()

    // Sort by priority
    const sorted = [...requests].sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Process sequentially (rate limiter handles spacing)
    for (const request of sorted) {
      const key =
        request.cacheKey ||
        `claude:${this.hashPrompt(request.prompt + (request.systemPrompt || ''))}`
      const result = await this.processRequest(request)
      results.set(key, result)
    }

    return results
  }

  /**
   * Get request statistics for monitoring
   */
  getStats(): {
    totalRequests: number
    cacheHits: number
    apiCalls: number
    errors: number
    avgLatencyMs: number
  } {
    return {
      ...this.stats,
      avgLatencyMs:
        this.stats.totalRequests > 0
          ? this.stats.totalLatencyMs / this.stats.totalRequests
          : 0,
    }
  }

  /**
   * Enqueue request and process queue
   */
  private async enqueueRequest(
    request: ClaudeRequest
  ): Promise<Result<ClaudeResponse>> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject })

      // Sort queue by priority
      this.queue.sort((a, b) => {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
        return (
          priorityOrder[a.request.priority] -
          priorityOrder[b.request.priority]
        )
      })

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue()
      }
    })
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const item = this.queue.shift()
      if (!item) break

      try {
        // Wait for rate limiter slot
        await this.rateLimiter.waitForSlot()

        // Make API call
        const result = await this.callClaudeAPI(item.request)
        item.resolve(result)
      } catch (error) {
        item.resolve(
          err(error instanceof Error ? error : new Error('Unknown error occurred'))
        )
      }
    }

    this.processing = false
  }

  /**
   * Call Claude API with retry logic
   */
  private async callClaudeAPI(
    request: ClaudeRequest
  ): Promise<Result<ClaudeResponse>> {
    // Check if API key is configured
    if (!this.client) {
      return err(new Error('ANTHROPIC_API_KEY not configured'))
    }

    const maxRetries = 3
    const baseDelayMs = 1000

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature || 0.7,
          system: request.systemPrompt,
          messages: [
            {
              role: 'user',
              content: request.prompt,
            },
          ],
        })

        this.stats.apiCalls++

        return ok({
          content:
            response.content[0].type === 'text'
              ? response.content[0].text
              : '',
          model: response.model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cached: false,
        })
      } catch (error) {
        // Handle 429 rate limit errors with exponential backoff
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          error.status === 429
        ) {
          if (attempt < maxRetries) {
            // Exponential backoff with jitter
            const delay =
              baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000
            console.log(
              `Claude API 429 error. Retry ${attempt + 1}/${maxRetries} in ${Math.ceil(delay / 1000)}s...`
            )
            await new Promise((resolve) => setTimeout(resolve, delay))
            continue
          }
        }

        // Other errors or max retries exceeded
        return err(
          error instanceof Error ? error : new Error('Claude API call failed')
        )
      }
    }

    return err(new Error('Max retries exceeded'))
  }

  /**
   * Simple hash function for cache keys (djb2 algorithm)
   */
  private hashPrompt(prompt: string): string {
    let hash = 5381
    for (let i = 0; i < prompt.length; i++) {
      hash = (hash * 33) ^ prompt.charCodeAt(i)
    }
    return (hash >>> 0).toString(36)
  }
}

// Singleton instance
let orchestratorInstance: ClaudeOrchestrator | null = null

export function getOrchestrator(cache?: CacheManager): ClaudeOrchestrator {
  if (!orchestratorInstance) {
    // Use provided cache or get singleton
    const cacheManager = cache || require('@/lib/cache/manager').getCacheManager()
    orchestratorInstance = new ClaudeOrchestrator(cacheManager)
  }
  return orchestratorInstance
}
