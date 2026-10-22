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
// Claude often writes `null` for a field it has nothing for; treat that as absent.
const nullAsMissing = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === null ? undefined : v), schema)

const dataPointValue = z.union([z.number(), z.string(), z.array(z.union([z.number(), z.string()]))])

export const nlqResponseSchema = z.object({
  interpretation: z.string(),
  answer: z.string().nullable(),
  dataPoints: z.preprocess(
    (v) =>
      v && typeof v === 'object' && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).filter(([, value]) => value !== null))
        : v,
    z.record(z.string(), dataPointValue).nullish()
  ),
  needsClarification: z.boolean(),
  clarificationQuestion: nullAsMissing(z.string().optional()),
  clarificationOptions: nullAsMissing(z.array(z.string()).optional()),
  sources: z.array(z.string()),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  suggestedFollowUps: nullAsMissing(z.array(z.string()).optional()),
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
