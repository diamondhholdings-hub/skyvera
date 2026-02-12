/**
 * Type definitions for DM% Strategy Engine
 * Recommendations, portfolio summaries, and impact calculations
 */

import { z } from 'zod'
import { BUEnum } from './financial'

/**
 * Recommendation priority levels
 */
export const RecommendationPriorityEnum = z.enum(['critical', 'high', 'medium', 'low'])
export type RecommendationPriority = z.infer<typeof RecommendationPriorityEnum>

/**
 * Recommendation types/categories
 */
export const RecommendationTypeEnum = z.enum([
  'retention',
  'expansion',
  'pricing',
  'product',
  'engagement',
  'health',
])
export type RecommendationType = z.infer<typeof RecommendationTypeEnum>

/**
 * Recommendation status
 */
export const RecommendationStatusEnum = z.enum([
  'pending',
  'in_progress',
  'completed',
  'dismissed',
])
export type RecommendationStatus = z.infer<typeof RecommendationStatusEnum>

/**
 * Single DM% recommendation
 */
export const DMRecommendationSchema = z.object({
  id: z.string(),
  bu: BUEnum,
  accountName: z.string().optional(),
  priority: RecommendationPriorityEnum,
  type: RecommendationTypeEnum,
  status: RecommendationStatusEnum,
  title: z.string(),
  description: z.string(),
  rationale: z.string(),
  suggestedAction: z.string(),
  estimatedARRImpact: z.number(), // Dollar amount
  estimatedDMImpact: z.number(), // Percentage points
  estimatedEffort: z.enum(['low', 'medium', 'high']),
  timeframe: z.string(), // e.g., "30 days", "Q2'26"
  owner: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type DMRecommendation = z.infer<typeof DMRecommendationSchema>

/**
 * Portfolio summary for a single BU
 */
export const BUPortfolioSummarySchema = z.object({
  bu: BUEnum,
  currentDM: z.number(), // Current DM%
  targetDM: z.number(), // Target DM% (usually 90%)
  dmGap: z.number(), // Percentage points below target
  currentARR: z.number(),
  atRiskARR: z.number(), // ARR at risk from poor DM%
  recommendationCount: z.number(),
  criticalCount: z.number(),
  highCount: z.number(),
  totalEstimatedImpact: z.number(), // Sum of all recommendation ARR impacts
})
export type BUPortfolioSummary = z.infer<typeof BUPortfolioSummarySchema>

/**
 * Complete portfolio summary across all BUs
 */
export const PortfolioSummarySchema = z.object({
  businessUnits: z.array(BUPortfolioSummarySchema),
  consolidated: z.object({
    totalARR: z.number(),
    weightedDM: z.number(),
    targetDM: z.number(),
    totalAtRiskARR: z.number(),
    totalRecommendations: z.number(),
    criticalRecommendations: z.number(),
    highRecommendations: z.number(),
    totalEstimatedImpact: z.number(),
  }),
})
export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>

/**
 * Recommendation filters
 */
export interface RecommendationFilters {
  bu?: string
  priority?: RecommendationPriority
  type?: RecommendationType
  status?: RecommendationStatus
  accountName?: string
}

/**
 * Impact calculation result
 */
export interface ImpactCalculation {
  selectedRecommendations: number
  totalARRImpact: number
  totalDMImpact: number
  estimatedTimeframe: string
  projectedDM: number
  dmGapClosure: number // Percentage of gap closed
}
