/**
 * DataValidator - validates all external data at boundaries using Zod schemas
 * Wraps validation in Result types for explicit error handling
 */

import { z, type ZodSchema } from 'zod'
import { CustomerSchema } from '../types/customer'
import { FinancialMetricsSchema } from '../types/financial'
import { ok, err, type Result } from '../types/result'

export interface ValidationError {
  message: string
  field?: string
  value?: unknown
}

/**
 * DataValidator class - validates incoming data against Zod schemas
 */
export class DataValidator {
  /**
   * Validate customer data
   */
  validateCustomer(data: unknown): Result<z.infer<typeof CustomerSchema>, ValidationError> {
    const result = CustomerSchema.safeParse(data)

    if (result.success) {
      return ok(result.data)
    } else {
      const firstError = result.error.issues[0]
      const error: ValidationError = {
        message: `Customer validation failed: ${firstError.message}`,
        field: firstError.path.join('.'),
        value: firstError.code === 'invalid_type' ? (data as any)?.[firstError.path[0]] : undefined,
      }

      // Log validation failure with context
      console.warn('[DataValidator] Customer validation failed:', {
        field: error.field,
        message: firstError.message,
        value: error.value,
        code: firstError.code,
      })

      return err(error)
    }
  }

  /**
   * Validate financial metrics data
   */
  validateFinancial(
    data: unknown
  ): Result<z.infer<typeof FinancialMetricsSchema>, ValidationError> {
    const result = FinancialMetricsSchema.safeParse(data)

    if (result.success) {
      return ok(result.data)
    } else {
      const firstError = result.error.issues[0]
      const error: ValidationError = {
        message: `Financial metrics validation failed: ${firstError.message}`,
        field: firstError.path.join('.'),
        value: firstError.code === 'invalid_type' ? (data as any)?.[firstError.path[0]] : undefined,
      }

      // Log validation failure with context
      console.warn('[DataValidator] Financial validation failed:', {
        field: error.field,
        message: firstError.message,
        value: error.value,
        code: firstError.code,
      })

      return err(error)
    }
  }

  /**
   * Batch validate multiple records
   * Returns valid records and detailed errors for invalid ones
   */
  validateBatch<T>(
    data: unknown[],
    schema: ZodSchema<T>
  ): {
    valid: T[]
    invalid: Array<{ index: number; errors: string[] }>
  } {
    const valid: T[] = []
    const invalid: Array<{ index: number; errors: string[] }> = []

    data.forEach((item, index) => {
      const result = schema.safeParse(item)

      if (result.success) {
        valid.push(result.data)
      } else {
        const errors = result.error.issues.map(
          (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
        )
        invalid.push({ index, errors })

        // Log batch validation failures
        console.warn(`[DataValidator] Batch validation failed at index ${index}:`, {
          errors,
          item: JSON.stringify(item).substring(0, 200), // Limit log size
        })
      }
    })

    return { valid, invalid }
  }

  /**
   * Reconcile data from multiple sources
   * Applies source-of-truth rules (Excel is authoritative for financials)
   *
   * @param sources Map of source name to data object
   * @returns Merged data with Excel taking precedence
   */
  reconcile(sources: Map<string, unknown>): Result<Record<string, unknown>, ValidationError> {
    try {
      const merged: Record<string, unknown> = {}

      // Define source priority (lower number = higher priority)
      const priority: Record<string, number> = {
        excel: 1,
        salesforce: 2,
        api: 3,
        cache: 4,
      }

      // Sort sources by priority
      const sortedSources = Array.from(sources.entries()).sort((a, b) => {
        const priorityA = priority[a[0].toLowerCase()] || 999
        const priorityB = priority[b[0].toLowerCase()] || 999
        return priorityA - priorityB
      })

      // Merge data, with higher priority sources overwriting lower priority
      for (const [sourceName, data] of sortedSources) {
        if (typeof data === 'object' && data !== null) {
          Object.assign(merged, data)
        }
      }

      console.debug('[DataValidator] Reconciled data from sources:', {
        sources: Array.from(sources.keys()),
        fieldCount: Object.keys(merged).length,
      })

      return ok(merged)
    } catch (error) {
      return err({
        message: `Data reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }
}
