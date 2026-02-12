/**
 * Notion Integration Examples
 *
 * This file demonstrates practical usage of the NotionAdapter for common workflows.
 * Use these examples as templates for integrating Notion with your Skyvera application.
 */

import type { NotionAdapter } from './notion'
import type {
  NotionAccountPlan,
  NotionCustomerIntelligence,
  NotionAlert,
  NotionActionItem,
  NotionBatchWriteRequest,
} from '@/lib/types/notion'
import { getConnectorFactory } from '@/lib/data/registry/connector-factory'

// ===== EXAMPLE 1: Sync Account Intelligence to Notion =====

/**
 * Push account intelligence from Skyvera to Notion
 * This creates or updates an account plan with the latest data
 */
export async function syncAccountToNotion(
  accountName: string,
  accountData: {
    businessUnit: 'Cloudsense' | 'Kandy' | 'STL'
    healthScore: number
    arr: number
    status: 'active' | 'at_risk' | 'growth' | 'maintenance'
    churnRisk: 'low' | 'medium' | 'high'
    executiveSummary: string
    strategicInitiatives: string[]
    keyContacts: Array<{ name: string; role: string; email?: string }>
  }
) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  if (!notion) {
    throw new Error('Notion adapter not available')
  }

  // Check if Notion is configured
  const status = notion.getStatus()
  if (status.degraded) {
    console.log('Notion not configured - skipping sync')
    return { success: false, reason: 'not_configured' }
  }

  // Build account plan
  const accountPlan: NotionAccountPlan = {
    accountName,
    businessUnit: accountData.businessUnit,
    accountStatus: accountData.status,
    healthScore: accountData.healthScore,
    arr: accountData.arr,
    executiveSummary: accountData.executiveSummary,
    strategicInitiatives: accountData.strategicInitiatives,
    keyContacts: accountData.keyContacts,
    churnRisk: accountData.churnRisk,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'skyvera-system',
  }

  // Check if account plan already exists
  const existingPlan = await notion.readAccountPlan(accountName)

  if (existingPlan.success && existingPlan.value) {
    // Update existing plan
    accountPlan.id = existingPlan.value.id
  }

  // Write to Notion
  const result = await notion.writeAccountPlan(accountPlan)

  if (result.success) {
    console.log(`✓ Account plan synced to Notion: ${accountName}`)
    return { success: true, pageId: result.value }
  } else {
    console.error(`✗ Failed to sync account plan: ${result.error.message}`)
    return { success: false, error: result.error.message }
  }
}

// ===== EXAMPLE 2: Create Risk Alerts =====

/**
 * Generate and push risk alerts to Notion based on account health
 */
export async function createRiskAlerts(
  accountName: string,
  healthScore: number,
  churnIndicators: {
    arAging: number // Days past due
    usageDecline: number // Percentage decline
    supportTickets: number // Open critical tickets
    executiveEngagement: boolean // Recent executive contact
  }
) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  if (!notion || notion.getStatus().degraded) {
    return { success: false, reason: 'not_configured' }
  }

  const alerts: NotionAlert[] = []

  // Health score alert
  if (healthScore < 60) {
    alerts.push({
      accountName,
      alertType: 'churn_risk',
      severity: healthScore < 40 ? 'critical' : 'high',
      title: `Low health score: ${healthScore}/100`,
      description: `Account health has fallen below threshold. Immediate attention required.`,
      status: 'open',
      priority: healthScore < 40 ? 10 : 8,
      createdAt: new Date().toISOString(),
    })
  }

  // AR aging alert
  if (churnIndicators.arAging > 90) {
    alerts.push({
      accountName,
      alertType: 'payment_overdue',
      severity: 'high',
      title: `Payment overdue: ${churnIndicators.arAging} days`,
      description: `Account has outstanding payments past ${churnIndicators.arAging} days. Collection risk identified.`,
      status: 'open',
      priority: 9,
      createdAt: new Date().toISOString(),
    })
  }

  // Usage decline alert
  if (churnIndicators.usageDecline > 30) {
    alerts.push({
      accountName,
      alertType: 'churn_risk',
      severity: 'medium',
      title: `Usage declined ${churnIndicators.usageDecline}%`,
      description: `Significant drop in product usage detected. May indicate disengagement.`,
      status: 'open',
      priority: 7,
      createdAt: new Date().toISOString(),
    })
  }

  // Support ticket alert
  if (churnIndicators.supportTickets > 5) {
    alerts.push({
      accountName,
      alertType: 'churn_risk',
      severity: 'medium',
      title: `${churnIndicators.supportTickets} open critical tickets`,
      description: `High volume of unresolved support issues. Customer satisfaction at risk.`,
      status: 'open',
      priority: 6,
      createdAt: new Date().toISOString(),
    })
  }

  // Executive engagement alert
  if (!churnIndicators.executiveEngagement) {
    alerts.push({
      accountName,
      alertType: 'churn_risk',
      severity: 'low',
      title: 'No recent executive engagement',
      description: `No executive-level contact in past 90 days. Schedule QBR.`,
      status: 'open',
      priority: 5,
      createdAt: new Date().toISOString(),
    })
  }

  // Write alerts to Notion
  const batchResult = await notion.batchWrite({ alerts })

  if (batchResult.success) {
    console.log(`✓ Created ${alerts.length} alerts for ${accountName}`)
    return {
      success: true,
      alertsCreated: batchResult.value.alerts.recordsCreated,
    }
  } else {
    console.error(`✗ Failed to create alerts: ${batchResult.error.message}`)
    return { success: false, error: batchResult.error.message }
  }
}

// ===== EXAMPLE 3: Generate Action Items from Alerts =====

/**
 * Convert high-priority alerts into actionable tasks
 */
export async function generateActionItemsFromAlerts(accountName: string) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  if (!notion || notion.getStatus().degraded) {
    return { success: false, reason: 'not_configured' }
  }

  // Read open alerts
  const alertsResult = await notion.readAlerts(accountName, 'open')

  if (!alertsResult.success || alertsResult.value.length === 0) {
    return { success: true, actionItems: 0 }
  }

  const actionItems: NotionActionItem[] = []

  // Generate action items for high/critical alerts
  for (const alert of alertsResult.value) {
    if (alert.severity === 'high' || alert.severity === 'critical') {
      const item: NotionActionItem = {
        accountName,
        title: `Address: ${alert.title}`,
        description: `${alert.description}\n\nAlert ID: ${alert.id}\nSeverity: ${alert.severity}`,
        category: alert.alertType === 'payment_overdue' ? 'risk_mitigation' : 'followup',
        status: 'todo',
        assignedTo: 'csm-team@skyvera.com',
        priority: alert.severity === 'critical' ? 'urgent' : 'high',
        dueDate: getNextBusinessDay(alert.severity === 'critical' ? 1 : 3),
        createdAt: new Date().toISOString(),
        createdBy: 'automation',
      }
      actionItems.push(item)
    }
  }

  if (actionItems.length === 0) {
    return { success: true, actionItems: 0 }
  }

  // Write action items
  const batchResult = await notion.batchWrite({ actionItems })

  if (batchResult.success) {
    console.log(`✓ Created ${actionItems.length} action items for ${accountName}`)
    return {
      success: true,
      actionItems: batchResult.value.actionItems.recordsCreated,
    }
  } else {
    console.error(`✗ Failed to create action items: ${batchResult.error.message}`)
    return { success: false, error: batchResult.error.message }
  }
}

// ===== EXAMPLE 4: Import Strategic Context =====

/**
 * Read strategic context from Notion for AI analysis
 */
export async function importStrategicContext(accountName: string) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  if (!notion || notion.getStatus().degraded) {
    return null
  }

  const planResult = await notion.readAccountPlan(accountName)

  if (!planResult.success || !planResult.value) {
    return null
  }

  const plan = planResult.value

  // Build strategic context for Claude
  const context = {
    accountName: plan.accountName,
    businessUnit: plan.businessUnit,
    healthScore: plan.healthScore,
    arr: plan.arr,
    churnRisk: plan.churnRisk,
    summary: plan.executiveSummary,
    initiatives: plan.strategicInitiatives,
    contacts: plan.keyContacts.map((c) => ({
      name: c.name,
      role: c.role,
    })),
    lastUpdated: plan.lastUpdated,
  }

  console.log(`✓ Imported strategic context for ${accountName}`)
  return context
}

// ===== EXAMPLE 5: Push News Intelligence to Notion =====

/**
 * Sync customer intelligence (news, OSINT) to Notion
 */
export async function pushNewsIntelligence(
  accountName: string,
  intelligence: {
    industryInsights: string
    competitorActivity?: string
    newsArticles: Array<{
      title: string
      url: string
      publishedAt: string
      summary: string
    }>
    sentiment: 'positive' | 'neutral' | 'negative'
    relevanceScore: number
    source: string
  }
) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  if (!notion || notion.getStatus().degraded) {
    return { success: false, reason: 'not_configured' }
  }

  const customerIntelligence: NotionCustomerIntelligence = {
    accountName,
    industryInsights: intelligence.industryInsights,
    competitorActivity: intelligence.competitorActivity,
    newsArticles: intelligence.newsArticles,
    overallSentiment: intelligence.sentiment,
    relevanceScore: intelligence.relevanceScore,
    lastFetched: new Date().toISOString(),
    source: intelligence.source,
  }

  // Check if intelligence already exists
  const existingIntel = await notion.readCustomerIntelligence(accountName)

  if (existingIntel.success && existingIntel.value) {
    customerIntelligence.id = existingIntel.value.id
  }

  const result = await notion.writeCustomerIntelligence(customerIntelligence)

  if (result.success) {
    console.log(`✓ Intelligence synced to Notion: ${accountName}`)

    // Create alert if negative sentiment detected
    if (intelligence.sentiment === 'negative' && intelligence.relevanceScore > 0.7) {
      const alert: NotionAlert = {
        accountName,
        alertType: 'negative_news',
        severity: 'medium',
        title: 'Negative news coverage detected',
        description: `Recent news articles show negative sentiment (relevance: ${Math.round(intelligence.relevanceScore * 100)}%)`,
        status: 'open',
        priority: 6,
        createdAt: new Date().toISOString(),
      }
      await notion.writeAlert(alert)
    }

    return { success: true, pageId: result.value }
  } else {
    console.error(`✗ Failed to sync intelligence: ${result.error.message}`)
    return { success: false, error: result.error.message }
  }
}

// ===== EXAMPLE 6: Bulk Sync All Accounts =====

/**
 * Sync all accounts to Notion in batch
 */
export async function bulkSyncAccounts(
  accounts: Array<{
    name: string
    businessUnit: 'Cloudsense' | 'Kandy' | 'STL'
    healthScore: number
    arr: number
    status: 'active' | 'at_risk' | 'growth' | 'maintenance'
    churnRisk: 'low' | 'medium' | 'high'
    summary: string
  }>
) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  if (!notion || notion.getStatus().degraded) {
    return { success: false, reason: 'not_configured' }
  }

  const accountPlans: NotionAccountPlan[] = accounts.map((account) => ({
    accountName: account.name,
    businessUnit: account.businessUnit,
    accountStatus: account.status,
    healthScore: account.healthScore,
    arr: account.arr,
    executiveSummary: account.summary,
    strategicInitiatives: [],
    keyContacts: [],
    churnRisk: account.churnRisk,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'bulk-sync',
  }))

  const batchResult = await notion.batchWrite({ accountPlans })

  if (batchResult.success) {
    const { accountPlans: stats } = batchResult.value
    console.log(`✓ Bulk sync complete:`)
    console.log(`  - Synced: ${stats.recordsSynced}`)
    console.log(`  - Created: ${stats.recordsCreated}`)
    console.log(`  - Updated: ${stats.recordsUpdated}`)
    console.log(`  - Errors: ${stats.errors.length}`)

    return {
      success: true,
      synced: stats.recordsSynced,
      created: stats.recordsCreated,
      updated: stats.recordsUpdated,
      errors: stats.errors,
    }
  } else {
    console.error(`✗ Bulk sync failed: ${batchResult.error.message}`)
    return { success: false, error: batchResult.error.message }
  }
}

// ===== EXAMPLE 7: Renewal Pipeline Management =====

/**
 * Create renewal tracking action items for upcoming renewals
 */
export async function createRenewalPipeline(
  renewals: Array<{
    accountName: string
    renewalDate: string
    arr: number
    daysUntilRenewal: number
  }>
) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  if (!notion || notion.getStatus().degraded) {
    return { success: false, reason: 'not_configured' }
  }

  const actionItems: NotionActionItem[] = []
  const alerts: NotionAlert[] = []

  for (const renewal of renewals) {
    // Create alert if renewal is within 90 days
    if (renewal.daysUntilRenewal <= 90) {
      alerts.push({
        accountName: renewal.accountName,
        alertType: 'renewal_upcoming',
        severity: renewal.daysUntilRenewal <= 30 ? 'high' : 'medium',
        title: `Renewal in ${renewal.daysUntilRenewal} days`,
        description: `Contract renewal date: ${renewal.renewalDate}\nARR: $${renewal.arr.toLocaleString()}`,
        status: 'open',
        priority: renewal.daysUntilRenewal <= 30 ? 9 : 7,
        createdAt: new Date().toISOString(),
      })
    }

    // Create action items based on timeline
    if (renewal.daysUntilRenewal <= 120 && renewal.daysUntilRenewal > 90) {
      // 90-120 days: Begin renewal discussions
      actionItems.push({
        accountName: renewal.accountName,
        title: 'Initiate renewal discussions',
        description: `Schedule call to discuss renewal terms and roadmap.\nCurrent ARR: $${renewal.arr.toLocaleString()}\nRenewal Date: ${renewal.renewalDate}`,
        category: 'renewal',
        status: 'todo',
        assignedTo: 'csm-team@skyvera.com',
        priority: 'high',
        dueDate: getNextBusinessDay(7),
        createdAt: new Date().toISOString(),
        createdBy: 'renewal-automation',
      })
    } else if (renewal.daysUntilRenewal <= 90 && renewal.daysUntilRenewal > 60) {
      // 60-90 days: Proposal stage
      actionItems.push({
        accountName: renewal.accountName,
        title: 'Send renewal proposal',
        description: `Prepare and send renewal proposal with updated terms.\nCurrent ARR: $${renewal.arr.toLocaleString()}`,
        category: 'renewal',
        status: 'todo',
        assignedTo: 'csm-team@skyvera.com',
        priority: 'high',
        dueDate: getNextBusinessDay(3),
        createdAt: new Date().toISOString(),
        createdBy: 'renewal-automation',
      })
    } else if (renewal.daysUntilRenewal <= 60 && renewal.daysUntilRenewal > 30) {
      // 30-60 days: Negotiation
      actionItems.push({
        accountName: renewal.accountName,
        title: 'Finalize renewal terms',
        description: `Complete contract negotiations and finalize renewal terms.`,
        category: 'renewal',
        status: 'todo',
        assignedTo: 'csm-team@skyvera.com',
        priority: 'urgent',
        dueDate: getNextBusinessDay(2),
        createdAt: new Date().toISOString(),
        createdBy: 'renewal-automation',
      })
    } else if (renewal.daysUntilRenewal <= 30) {
      // < 30 days: Execute
      actionItems.push({
        accountName: renewal.accountName,
        title: 'Execute renewal contract',
        description: `Urgent: Contract expires in ${renewal.daysUntilRenewal} days. Execute signed agreement.`,
        category: 'renewal',
        status: 'in_progress',
        assignedTo: 'csm-team@skyvera.com',
        priority: 'urgent',
        dueDate: getNextBusinessDay(1),
        createdAt: new Date().toISOString(),
        createdBy: 'renewal-automation',
      })
    }
  }

  // Batch write
  const batchResult = await notion.batchWrite({ actionItems, alerts })

  if (batchResult.success) {
    console.log(`✓ Renewal pipeline created:`)
    console.log(`  - Alerts: ${batchResult.value.alerts.recordsCreated}`)
    console.log(`  - Action Items: ${batchResult.value.actionItems.recordsCreated}`)

    return {
      success: true,
      alerts: batchResult.value.alerts.recordsCreated,
      actionItems: batchResult.value.actionItems.recordsCreated,
    }
  } else {
    console.error(`✗ Failed to create renewal pipeline: ${batchResult.error.message}`)
    return { success: false, error: batchResult.error.message }
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Get next business day (skip weekends)
 */
function getNextBusinessDay(daysOut: number = 1): string {
  const date = new Date()
  let businessDaysAdded = 0

  while (businessDaysAdded < daysOut) {
    date.setDate(date.getDate() + 1)
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday (0) or Saturday (6)
      businessDaysAdded++
    }
  }

  return date.toISOString().split('T')[0] // YYYY-MM-DD format
}
