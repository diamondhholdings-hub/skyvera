/**
 * DM% Strategy Engine - Types and Zod Schemas
 * Types for revenue retention recommendations and analysis
 */

import { z } from 'zod'

// Recommendation types
export const RecommendationTypeSchema = z.enum([
  'pricing',
  'product_enhancement',
  'account_intervention',
  'upsell',
  'contract_restructure',
  'competitive_defense',
  'churn_prevention',
  'portfolio_optimization',
])
export type RecommendationType = z.infer<typeof RecommendationTypeSchema>

// Priority levels
export const PriorityLevelSchema = z.enum(['critical', 'high', 'medium', 'low'])
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>

// Recommendation status
export const RecommendationStatusSchema = z.enum([
  'pending',
  'accepted',
  'deferred',
  'completed',
  'rejected',
])
export type RecommendationStatus = z.infer<typeof RecommendationStatusSchema>

// Impact metrics for financial modeling
export const ImpactMetricsSchema = z.object({
  arrImpact: z.number(), // Expected ARR impact in dollars
  dmImpact: z.number(), // Expected DM% change (e.g., +2.5 = 2.5% improvement)
  marginImpact: z.number(), // Expected margin impact in percentage points
  confidenceLevel: z.number().min(0).max(100), // 0-100 confidence score
})
export type ImpactMetrics = z.infer<typeof ImpactMetricsSchema>

// Timeline for recommendation execution
export const TimelineSchema = z.enum([
  'immediate', // 0-30 days
  'short-term', // 30-90 days
  'medium-term', // 90-180 days
  'long-term', // 180+ days
])
export type Timeline = z.infer<typeof TimelineSchema>

// Risk level
export const RiskLevelSchema = z.enum(['high', 'medium', 'low'])
export type RiskLevel = z.infer<typeof RiskLevelSchema>

// Owner team
export const OwnerTeamSchema = z.enum([
  'CSM',
  'Sales',
  'Product',
  'Engineering',
  'Executive',
  'Finance',
])
export type OwnerTeam = z.infer<typeof OwnerTeamSchema>

// Core DM Recommendation
export const DMRecommendationSchema = z.object({
  id: z.string().optional(), // Database ID
  recommendationId: z.string(), // Unique recommendation ID
  accountName: z.string(),
  bu: z.string(),
  type: RecommendationTypeSchema,
  priority: PriorityLevelSchema,

  // Description
  title: z.string(),
  description: z.string(),
  reasoning: z.string(),

  // Impact
  impact: ImpactMetricsSchema,

  // Execution
  timeline: TimelineSchema,
  ownerTeam: OwnerTeamSchema,
  risk: RiskLevelSchema,

  // Status
  status: RecommendationStatusSchema.default('pending'),

  // Metadata
  createdAt: z.date().optional(),
  acceptedAt: z.date().optional(),
  completedAt: z.date().optional(),
  deferredReason: z.string().optional(),
  linkedActionItemId: z.string().optional(),
})
export type DMRecommendation = z.infer<typeof DMRecommendationSchema>

// Account DM Analysis
export const AccountDMAnalysisSchema = z.object({
  accountName: z.string(),
  bu: z.string(),
  currentDM: z.number(), // Current DM% (e.g., 94.7)
  projectedDM: z.number(), // Projected DM% without intervention
  targetDM: z.number().default(90), // Target DM% (default 90%)

  // Risk assessment
  atRisk: z.boolean(),
  riskFactors: z.array(z.string()),

  // Opportunities
  hasGrowthOpportunity: z.boolean(),
  opportunityFactors: z.array(z.string()),

  // Financial context
  currentARR: z.number(),
  projectedARRImpact: z.number(), // Total potential ARR impact from all recommendations

  // Recommendations
  recommendations: z.array(DMRecommendationSchema),

  // Analysis timestamp
  analyzedAt: z.date(),
})
export type AccountDMAnalysis = z.infer<typeof AccountDMAnalysisSchema>

// Portfolio DM Analysis
export const PortfolioDMAnalysisSchema = z.object({
  bu: z.string().optional(), // If analyzing single BU, otherwise "All"
  totalAccounts: z.number(),
  accountsAnalyzed: z.number(),

  // DM metrics
  currentDM: z.number(), // Weighted average current DM%
  projectedDM: z.number(), // Projected DM% without intervention
  targetDM: z.number().default(90),

  // Risk summary
  atRiskAccounts: z.number(),
  totalARRAtRisk: z.number(),

  // Opportunity summary
  growthAccounts: z.number(),
  totalARROpportunity: z.number(),

  // Recommendations summary
  totalRecommendations: z.number(),
  recommendationsByType: z.record(z.string(), z.number()),
  recommendationsByPriority: z.record(z.string(), z.number()),

  // Projected impact
  projectedARRImpact: z.number(), // If all recommendations accepted
  projectedDMImprovement: z.number(), // Projected DM% after interventions

  // Account-level analyses
  accountAnalyses: z.array(AccountDMAnalysisSchema),

  // Analysis metadata
  analyzedAt: z.date(),
  analysisRunId: z.string(),
})
export type PortfolioDMAnalysis = z.infer<typeof PortfolioDMAnalysisSchema>

// Claude API response for recommendation generation
export const ClaudeRecommendationResponseSchema = z.object({
  recommendations: z.array(
    z.object({
      type: RecommendationTypeSchema,
      title: z.string(),
      description: z.string(),
      reasoning: z.string(),
      expectedImpact: z.object({
        arrImpact: z.number(),
        dmImpact: z.number(),
        marginImpact: z.number(),
      }),
      confidence: z.number().min(0).max(100),
      timeline: TimelineSchema,
      ownerTeam: OwnerTeamSchema,
      risk: RiskLevelSchema,
    })
  ),
})
export type ClaudeRecommendationResponse = z.infer<
  typeof ClaudeRecommendationResponseSchema
>

// Scenario projection for "what if all recommendations accepted"
export const DMScenarioProjectionSchema = z.object({
  baseline: z.object({
    totalARR: z.number(),
    avgDM: z.number(),
    totalRevenue: z.number(),
  }),
  projected: z.object({
    totalARR: z.number(),
    avgDM: z.number(),
    totalRevenue: z.number(),
  }),
  impact: z.object({
    arrChange: z.number(),
    arrChangePercent: z.number(),
    dmChange: z.number(),
    dmChangePercent: z.number(),
  }),
  recommendationsIncluded: z.number(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
})
export type DMScenarioProjection = z.infer<typeof DMScenarioProjectionSchema>

// Analysis run tracking
export const DMAnalysisRunSchema = z.object({
  runId: z.string(),
  runDate: z.date(),
  accountsAnalyzed: z.number(),
  recommendationsGenerated: z.number(),
  totalPotentialARR: z.number(),
  totalPotentialDM: z.number(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  error: z.string().optional(),
})
export type DMAnalysisRun = z.infer<typeof DMAnalysisRunSchema>
