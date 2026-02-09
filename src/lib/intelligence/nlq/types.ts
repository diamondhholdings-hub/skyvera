/**
 * Natural Language Query types and schemas
 * Defines request/response structures for NLQ processing
 */

import { z } from 'zod'

export interface CannedQuery {
  id: string
  label: string
  category: 'performance' | 'customers' | 'financials' | 'comparisons'
  template: string
  requiredFilters?: Array<'bu' | 'quarter' | 'customer'>
}

export interface QueryFilters {
  bu?: string
  quarter?: string
  customer?: string
}

/**
 * NLQ Request schema - validates incoming query requests
 */
export const nlqRequestSchema = z.object({
  query: z
    .string()
    .min(3, 'Query too short')
    .max(500, 'Query too long'),
  filters: z
    .object({
      bu: z.string().optional(),
      quarter: z.string().optional(),
      customer: z.string().optional(),
    })
    .optional(),
  conversationContext: z.string().optional(),
  cannedQueryId: z.string().optional(),
})

export type NLQRequest = z.infer<typeof nlqRequestSchema>

/**
 * NLQ Response schema - validates Claude API responses
 */
export const nlqResponseSchema = z.object({
  interpretation: z.string(),
  answer: z.string().nullable(),
  dataPoints: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().optional(),
  clarificationOptions: z.array(z.string()).optional(),
  sources: z.array(z.string()),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  suggestedFollowUps: z.array(z.string()).optional(),
})

export type NLQResponse = z.infer<typeof nlqResponseSchema>

/**
 * Query Result - full query execution result with metadata
 */
export interface QueryResult {
  query: string
  response: NLQResponse
  timestamp: Date
}
