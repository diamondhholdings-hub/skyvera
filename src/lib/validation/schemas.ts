/**
 * Shared Zod validation schemas for API route request bodies.
 *
 * Each schema is named after the route it protects and exported individually
 * so routes can import exactly what they need without pulling in the whole module.
 */

import { z } from 'zod'

// --------------------------------------------------------------------------
// Query route  POST /api/query
// (The NLQ route already uses nlqRequestSchema from @/lib/intelligence/nlq/types
//  so we keep this as an additive fallback / reference — not re-exported there)
// --------------------------------------------------------------------------

export const queryRequestSchema = z.object({
  query: z.string().min(1, 'query must not be empty').max(2000, 'query too long'),
  filters: z.record(z.unknown()).optional(),
  conversationContext: z.array(z.unknown()).optional(),
  cannedQueryId: z.string().optional(),
})

export type QueryRequest = z.infer<typeof queryRequestSchema>

// --------------------------------------------------------------------------
// Scenario analyze  POST /api/scenarios/analyze
// The route already uses scenarioInputSchema from its own types module; this
// wraps that shape at the HTTP boundary for documentation purposes.
// --------------------------------------------------------------------------

export const scenarioAnalyzeRequestSchema = z.object({
  type: z.string().min(1, 'type is required'),
  parameters: z.record(z.unknown()).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
})

export type ScenarioAnalyzeRequest = z.infer<typeof scenarioAnalyzeRequestSchema>

// --------------------------------------------------------------------------
// Scenario conversation start  POST /api/scenarios/conversation/start
// --------------------------------------------------------------------------

export const conversationStartSchema = z.object({
  query: z.string().min(5, 'query must be at least 5 characters').max(2000, 'query too long'),
})

export type ConversationStartRequest = z.infer<typeof conversationStartSchema>

// --------------------------------------------------------------------------
// Scenario conversation message  POST /api/scenarios/conversation/[id]/message
// --------------------------------------------------------------------------

export const conversationMessageSchema = z.object({
  message: z.string().min(1, 'message cannot be empty').max(2000, 'message too long'),
  conversationState: z.record(z.unknown()),
})

export type ConversationMessageRequest = z.infer<typeof conversationMessageSchema>

// --------------------------------------------------------------------------
// Account chat  POST /api/accounts/[name]/chat
// --------------------------------------------------------------------------

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'message cannot be empty')
    .max(2000, 'message too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .max(50, 'history too long')
    .optional()
    .default([]),
})

export type ChatMessageRequest = z.infer<typeof chatMessageSchema>

// --------------------------------------------------------------------------
// DM Strategy analyze  POST /api/dm-strategy/analyze
// --------------------------------------------------------------------------

export const dmStrategyAnalyzeSchema = z.object({
  bu: z
    .enum(['Cloudsense', 'Kandy', 'STL'])
    .optional(),
})

export type DmStrategyAnalyzeRequest = z.infer<typeof dmStrategyAnalyzeSchema>

// --------------------------------------------------------------------------
// DM Strategy analyze-account  POST /api/dm-strategy/analyze-account
// --------------------------------------------------------------------------

export const dmStrategyAnalyzeAccountSchema = z.object({
  accountName: z
    .string()
    .min(1, 'accountName must not be empty')
    .max(200, 'accountName too long'),
})

export type DmStrategyAnalyzeAccountRequest = z.infer<typeof dmStrategyAnalyzeAccountSchema>

// --------------------------------------------------------------------------
// Product agent analyze  POST /api/product-agent/analyze
// --------------------------------------------------------------------------

export const productAgentAnalyzeSchema = z.object({
  scope: z.string().optional(),
  businessUnit: z
    .enum(['Cloudsense', 'Kandy', 'STL', 'all'])
    .optional()
    .default('all'),
  analysisType: z.string().optional(),
  focus: z.string().optional(),
})

export type ProductAgentAnalyzeRequest = z.infer<typeof productAgentAnalyzeSchema>

// --------------------------------------------------------------------------
// Enrich  POST /api/enrich
// --------------------------------------------------------------------------

export const enrichRequestSchema = z.object({
  customerName: z
    .string()
    .min(1, 'customerName must not be empty')
    .max(200, 'customerName too long'),
})

export type EnrichRequest = z.infer<typeof enrichRequestSchema>

// --------------------------------------------------------------------------
// Account plan PATCH bodies
// POST /api/account-plan/[name]/pain-points/[id]
// POST /api/account-plan/[name]/actions/[id]
// --------------------------------------------------------------------------

export const painPointStatusValues = ['active', 'monitoring', 'resolved'] as const
export const actionStatusValues = ['pending', 'in-progress', 'completed', 'cancelled'] as const

export const patchPainPointSchema = z.object({
  status: z.enum(painPointStatusValues, {
    errorMap: () => ({
      message: `status must be one of: ${painPointStatusValues.join(', ')}`,
    }),
  }),
})

export const patchActionItemSchema = z.object({
  status: z.enum(actionStatusValues, {
    errorMap: () => ({
      message: `status must be one of: ${actionStatusValues.join(', ')}`,
    }),
  }),
})

export type PatchPainPointRequest = z.infer<typeof patchPainPointSchema>
export type PatchActionItemRequest = z.infer<typeof patchActionItemSchema>
