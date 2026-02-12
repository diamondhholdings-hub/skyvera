import { z } from 'zod'

/**
 * Account plan types and Zod schemas for strategic account intelligence
 * Models stakeholders, pain points, opportunities, actions, and competitors
 */

// Stakeholder role enums
export const StakeholderRoleSchema = z.enum([
  'decision-maker',
  'influencer',
  'champion',
  'user',
  'blocker',
])
export type StakeholderRole = z.infer<typeof StakeholderRoleSchema>

export const RACIRoleSchema = z.enum([
  'responsible',
  'accountable',
  'consulted',
  'informed',
])
export type RACIRole = z.infer<typeof RACIRoleSchema>

export const RelationshipStrengthSchema = z.enum([
  'strong',
  'moderate',
  'weak',
  'unknown',
])
export type RelationshipStrength = z.infer<typeof RelationshipStrengthSchema>

// Stakeholder schema for org hierarchy and relationship tracking
export const StakeholderSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  role: StakeholderRoleSchema,
  raciRole: RACIRoleSchema.optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  reportsTo: z.string().nullable().optional(), // Parent stakeholder ID for tree building (null for root)
  tenure: z.string().optional(),
  interests: z.array(z.string()).optional(),
  relationshipStrength: RelationshipStrengthSchema,
  lastInteraction: z.string().optional(), // ISO date string
  notes: z.string().optional(),
})
export type Stakeholder = z.infer<typeof StakeholderSchema>

// Pain point schema for strategy tab
export const PainPointStatusSchema = z.enum(['active', 'monitoring', 'resolved'])
export type PainPointStatus = z.infer<typeof PainPointStatusSchema>

export const SeveritySchema = z.enum(['high', 'medium', 'low'])
export type Severity = z.infer<typeof SeveritySchema>

export const PainPointSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: PainPointStatusSchema,
  severity: SeveritySchema,
  identifiedDate: z.string(), // ISO date string
  owner: z.string().optional(),
})
export type PainPoint = z.infer<typeof PainPointSchema>

// Opportunity schema for strategy tab
export const OpportunityStatusSchema = z.enum([
  'identified',
  'exploring',
  'proposed',
  'won',
  'lost',
])
export type OpportunityStatus = z.infer<typeof OpportunityStatusSchema>

export const OpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: OpportunityStatusSchema,
  estimatedValue: z.number().optional(),
  probability: z.number().min(0).max(100).optional(), // 0-100 percentage
  identifiedDate: z.string(), // ISO date string
  owner: z.string().optional(),
})
export type Opportunity = z.infer<typeof OpportunitySchema>

// Combined strategy data (pain points + opportunities)
export const StrategyDataSchema = z.object({
  painPoints: z.array(PainPointSchema),
  opportunities: z.array(OpportunitySchema),
})
export type StrategyData = z.infer<typeof StrategyDataSchema>

// Action item schema for actions tab
export const ActionStatusSchema = z.enum(['todo', 'in-progress', 'done'])
export type ActionStatus = z.infer<typeof ActionStatusSchema>

export const ActionPrioritySchema = z.enum(['high', 'medium', 'low'])
export type ActionPriority = z.infer<typeof ActionPrioritySchema>

export const ActionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: ActionStatusSchema,
  priority: ActionPrioritySchema,
  owner: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
  createdAt: z.string(), // ISO date string
})
export type ActionItem = z.infer<typeof ActionItemSchema>

// Competitor schema for competitive analysis tab
export const CompetitorTypeSchema = z.enum([
  'our-competitor', // Companies competing with Skyvera for this account
  'customer-competitor', // The customer's industry rivals
  'both',
])
export type CompetitorType = z.infer<typeof CompetitorTypeSchema>

export const CompetitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: CompetitorTypeSchema,
  description: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  lastUpdated: z.string(), // ISO date string
})
export type Competitor = z.infer<typeof CompetitorSchema>

// Intelligence report schema - structured data from markdown reports
export const IntelligenceOpportunitySchema = z.object({
  title: z.string(),
  description: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  estimatedValue: z.number().optional(),
})
export type IntelligenceOpportunity = z.infer<
  typeof IntelligenceOpportunitySchema
>

export const IntelligenceRiskSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: SeveritySchema,
  mitigation: z.string(),
})
export type IntelligenceRisk = z.infer<typeof IntelligenceRiskSchema>

export const IntelligenceRecommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: ActionPrioritySchema,
  nextSteps: z.array(z.string()).optional(),
})
export type IntelligenceRecommendation = z.infer<
  typeof IntelligenceRecommendationSchema
>

export const IntelligenceReportSchema = z.object({
  customerName: z.string(),
  generatedAt: z.string(), // ISO date string
  summary: z.string(),
  opportunities: z.array(IntelligenceOpportunitySchema),
  risks: z.array(IntelligenceRiskSchema),
  recommendations: z.array(IntelligenceRecommendationSchema),
})
export type IntelligenceReport = z.infer<typeof IntelligenceReportSchema>

// DM% Strategy Recommendation schema
export const DMRecommendationStatusSchema = z.enum([
  'pending',
  'accepted',
  'implemented',
  'dismissed',
])
export type DMRecommendationStatus = z.infer<typeof DMRecommendationStatusSchema>

export const DMRecommendationSchema = z.object({
  id: z.string(),
  recommendationId: z.string(),
  accountName: z.string(),
  title: z.string(),
  description: z.string(),
  priority: ActionPrioritySchema, // Reuse high/medium/low
  arrImpact: z.number(),
  dmImpact: z.number(), // Percentage points
  marginImpact: z.number().optional(),
  confidence: z.number().min(0).max(100), // 0-100 confidence score
  timeline: z.string(),
  owner: z.string().optional(),
  status: DMRecommendationStatusSchema,
  acceptedAt: z.string().optional(), // ISO date string
  implementedAt: z.string().optional(), // ISO date string
  linkedActionId: z.string().optional(),
  createdAt: z.string(), // ISO date string
})
export type DMRecommendation = z.infer<typeof DMRecommendationSchema>

// DM% Risk Level
export const DMRiskLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW'])
export type DMRiskLevel = z.infer<typeof DMRiskLevelSchema>

// Retention Strategy Data (recommendations + risk assessment)
export const RetentionStrategySchema = z.object({
  recommendations: z.array(DMRecommendationSchema),
  riskLevel: DMRiskLevelSchema,
  riskScore: z.number().min(0).max(100),
  riskFactors: z.array(z.string()),
  healthScore: z.number(),
  daysToRenewal: z.number().optional(),
})
export type RetentionStrategy = z.infer<typeof RetentionStrategySchema>
