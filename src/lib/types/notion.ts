import { z } from 'zod'

/**
 * Notion integration types for bidirectional database sync
 * Supports account plans, customer intelligence, alerts, and action items
 */

// ===== Notion Page and Database Metadata =====

export const NotionDatabaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['account_plans', 'customers', 'alerts', 'action_items', 'intelligence']),
  createdTime: z.string(),
  lastEditedTime: z.string(),
})
export type NotionDatabase = z.infer<typeof NotionDatabaseSchema>

// ===== Account Plan Types =====

export const NotionAccountPlanSchema = z.object({
  id: z.string().optional(), // Page ID in Notion (undefined for new records)
  accountName: z.string(),
  businessUnit: z.enum(['Cloudsense', 'Kandy', 'STL']),

  // Strategic information
  accountStatus: z.enum(['active', 'at_risk', 'growth', 'maintenance']),
  healthScore: z.number().min(0).max(100),
  arr: z.number(), // Annual Recurring Revenue

  // Strategic context
  executiveSummary: z.string(),
  strategicInitiatives: z.array(z.string()),
  keyContacts: z.array(z.object({
    name: z.string(),
    role: z.string(),
    email: z.string().optional(),
  })),

  // Renewal and risk
  renewalDate: z.string().optional(),
  churnRisk: z.enum(['low', 'medium', 'high']),

  // Metadata
  lastUpdated: z.string(),
  updatedBy: z.string().optional(),
})
export type NotionAccountPlan = z.infer<typeof NotionAccountPlanSchema>

// ===== Customer Intelligence Types =====

export const NotionCustomerIntelligenceSchema = z.object({
  id: z.string().optional(),
  accountName: z.string(),

  // Intelligence data
  industryInsights: z.string(),
  competitorActivity: z.string().optional(),
  newsArticles: z.array(z.object({
    title: z.string(),
    url: z.string(),
    publishedAt: z.string(),
    summary: z.string(),
  })),

  // OSINT data
  socialMediaActivity: z.string().optional(),
  jobPostings: z.string().optional(),
  financialNews: z.string().optional(),

  // Sentiment and relevance
  overallSentiment: z.enum(['positive', 'neutral', 'negative']),
  relevanceScore: z.number().min(0).max(1),

  // Metadata
  lastFetched: z.string(),
  source: z.string(),
})
export type NotionCustomerIntelligence = z.infer<typeof NotionCustomerIntelligenceSchema>

// ===== Alert Types =====

export const NotionAlertSchema = z.object({
  id: z.string().optional(),
  accountName: z.string(),

  // Alert details
  alertType: z.enum(['churn_risk', 'growth_opportunity', 'renewal_upcoming', 'negative_news', 'payment_overdue']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  description: z.string(),

  // Actions
  status: z.enum(['open', 'acknowledged', 'in_progress', 'resolved', 'dismissed']),
  assignedTo: z.string().optional(),

  // Metadata
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
  priority: z.number().min(1).max(10),
})
export type NotionAlert = z.infer<typeof NotionAlertSchema>

// ===== Action Item Types =====

export const NotionActionItemSchema = z.object({
  id: z.string().optional(),
  accountName: z.string(),

  // Task details
  title: z.string(),
  description: z.string(),
  category: z.enum(['followup', 'renewal', 'upsell', 'risk_mitigation', 'onboarding', 'support']),

  // Status and ownership
  status: z.enum(['todo', 'in_progress', 'blocked', 'completed', 'cancelled']),
  assignedTo: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),

  // Dates
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),

  // Metadata
  createdAt: z.string(),
  createdBy: z.string(),
})
export type NotionActionItem = z.infer<typeof NotionActionItemSchema>

// ===== Notion API Request/Response Types =====

export interface NotionPageCreateRequest {
  parent: {
    database_id: string
  }
  properties: Record<string, unknown>
}

export interface NotionPageUpdateRequest {
  properties: Record<string, unknown>
}

export interface NotionDatabaseQueryRequest {
  database_id: string
  filter?: {
    property: string
    [key: string]: unknown
  }
  sorts?: Array<{
    property: string
    direction: 'ascending' | 'descending'
  }>
  page_size?: number
}

export interface NotionDatabaseQueryResponse {
  results: Array<{
    id: string
    properties: Record<string, unknown>
    created_time: string
    last_edited_time: string
  }>
  has_more: boolean
  next_cursor: string | null
}

// ===== Sync Status Types =====

export const NotionSyncStatusSchema = z.object({
  lastSync: z.string(),
  recordsSynced: z.number(),
  recordsCreated: z.number(),
  recordsUpdated: z.number(),
  errors: z.array(z.object({
    recordId: z.string().optional(),
    recordName: z.string(),
    error: z.string(),
  })),
})
export type NotionSyncStatus = z.infer<typeof NotionSyncStatusSchema>

// ===== Batch Operations =====

export interface NotionBatchWriteRequest {
  accountPlans?: NotionAccountPlan[]
  intelligence?: NotionCustomerIntelligence[]
  alerts?: NotionAlert[]
  actionItems?: NotionActionItem[]
}

export interface NotionBatchWriteResponse {
  accountPlans: NotionSyncStatus
  intelligence: NotionSyncStatus
  alerts: NotionSyncStatus
  actionItems: NotionSyncStatus
}

// ===== Configuration =====

export interface NotionConfig {
  apiKey: string
  databases: {
    accountPlans?: string
    customers?: string
    alerts?: string
    actionItems?: string
    intelligence?: string
  }
}

export const NotionConfigSchema = z.object({
  apiKey: z.string(),
  databases: z.object({
    accountPlans: z.string().optional(),
    customers: z.string().optional(),
    alerts: z.string().optional(),
    actionItems: z.string().optional(),
    intelligence: z.string().optional(),
  }),
})
