import type { z } from 'zod'

/**
 * Custom error classes for type-safe error handling
 * Extends base Error with additional context fields
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public zodErrors?: z.ZodError
  ) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AdapterError extends AppError {
  constructor(
    message: string,
    public adapterName: string,
    public originalError?: Error
  ) {
    super(message, 'ADAPTER_ERROR', 500)
    this.name = 'AdapterError'
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string,
    public retryAfterMs: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429)
    this.name = 'RateLimitError'
  }
}

export class CacheError extends AppError {
  constructor(message: string) {
    super(message, 'CACHE_ERROR', 500)
    this.name = 'CacheError'
  }
}
