/**
 * Scenario modeling types and validation schemas
 * Federal Reserve-inspired bounds for what-if scenario modeling
 */

import { z } from 'zod'

// Financial scenario schema with Fed-style bounds
export const financialScenarioSchema = z.object({
  type: z.literal('financial'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  pricingChange: z.number().min(-50, 'Max 50% price decrease').max(100, 'Max 100% price increase'),
  costChange: z.number().min(-30, 'Max 30% cost reduction').max(100, 'Max 100% cost increase'),
  targetMargin: z.number().min(0, 'Margin cannot be negative').max(100, 'Margin cannot exceed 100%'),
  affectedBU: z.enum(['Cloudsense', 'Kandy', 'STL', 'All']).optional().default('All'),
})

// Headcount scenario schema
export const headcountScenarioSchema = z.object({
  type: z.literal('headcount'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  headcountChange: z.number().int('Must be whole number').min(-20, 'Max 20 person reduction').max(50, 'Max 50 person increase'),
  avgSalaryCost: z.number().min(50000, 'Min annual salary $50k').max(300000, 'Max annual salary $300k'),
  affectedBU: z.enum(['Cloudsense', 'Kandy', 'STL', 'All']).optional().default('All'),
})

// Customer scenario schema
export const customerScenarioSchema = z.object({
  type: z.literal('customer'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  churnRate: z.number().min(0, 'Churn rate cannot be negative').max(30, 'Max 30% churn rate'),
  acquisitionCount: z.number().int('Must be whole number').min(0, 'Cannot be negative').max(50, 'Max 50 new customers'),
  avgCustomerARR: z.number().min(10000, 'Min $10k ARR').max(5000000, 'Max $5M ARR'),
  affectedBU: z.enum(['Cloudsense', 'Kandy', 'STL', 'All']).optional().default('All'),
})

// Discriminated union for all scenario types
export const scenarioInputSchema = z.discriminatedUnion('type', [
  financialScenarioSchema,
  headcountScenarioSchema,
  customerScenarioSchema,
])

export type ScenarioInput = z.infer<typeof scenarioInputSchema>

// Impact metric for before/after comparison
export interface ImpactMetric {
  name: string
  before: number
  after: number
  change: number
  changePercent: number
}

// Claude response validation schema
export const scenarioImpactResponseSchema = z.object({
  impactSummary: z.string(),
  affectedMetrics: z.array(
    z.object({
      name: z.string(),
      before: z.number(),
      after: z.number(),
      change: z.number(),
      changePercent: z.number(),
    })
  ),
  risks: z.array(
    z.object({
      description: z.string(),
      severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      likelihood: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      mitigation: z.string(),
    })
  ),
  recommendation: z.enum(['APPROVE', 'APPROVE_WITH_CONDITIONS', 'REJECT']),
  reasoning: z.string(),
  conditions: z.array(z.string()),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
})

export type ScenarioImpactResponse = z.infer<typeof scenarioImpactResponseSchema>

// Complete scenario result
export interface ScenarioResult {
  input: ScenarioInput
  calculatedMetrics: ImpactMetric[]
  claudeAnalysis: ScenarioImpactResponse | null
  timestamp: Date
}
