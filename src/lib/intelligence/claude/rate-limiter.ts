/**
 * ClaudeRateLimiter - Token bucket rate limiter for Claude API
 * Prevents exceeding Claude API Tier 1 limits (50 requests per 60 seconds)
 */

import { RateLimiterMemory } from 'rate-limiter-flexible'

export class ClaudeRateLimiter {
  private limiter: RateLimiterMemory

  constructor() {
    // Claude API Tier 1 limits: 50 requests per 60 seconds
    this.limiter = new RateLimiterMemory({
      points: 50, // 50 requests
      duration: 60, // per 60 seconds
      execEvenly: true, // Distribute requests evenly across the window
    })
  }

  /**
   * Wait for a rate limit slot. If rate limit exceeded, wait and retry.
   * Uses recursive retry with safety counter (max 5 retries to prevent infinite loops).
   */
  async waitForSlot(retryCount = 0): Promise<void> {
    const maxRetries = 5

    if (retryCount >= maxRetries) {
      throw new Error(
        `Rate limiter exhausted after ${maxRetries} retries. This should not happen with proper configuration.`
      )
    }

    try {
      await this.limiter.consume('claude-api', 1)
    } catch (error) {
      // Rate limit exceeded, wait for next available slot
      if (error && typeof error === 'object' && 'msBeforeNext' in error) {
        const msBeforeNext = (error as { msBeforeNext: number }).msBeforeNext
        console.log(
          `Rate limit reached. Waiting ${Math.ceil(msBeforeNext / 1000)}s before retry...`
        )
        await new Promise((resolve) => setTimeout(resolve, msBeforeNext))
        // Retry
        return this.waitForSlot(retryCount + 1)
      }
      // Unknown error, re-throw
      throw error
    }
  }

  /**
   * Get remaining tokens for monitoring/display
   */
  getRemainingTokens(): number {
    try {
      const res = this.limiter.get('claude-api')
      if (res && typeof res === 'object' && 'remainingPoints' in res) {
        return (res as { remainingPoints: number }).remainingPoints
      }
      return 50 // Default to full capacity if can't get status
    } catch {
      return 50
    }
  }

  /**
   * Quick check without consuming a token
   */
  isAvailable(): boolean {
    return this.getRemainingTokens() > 0
  }
}
