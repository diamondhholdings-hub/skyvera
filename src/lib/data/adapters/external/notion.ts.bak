/**
 * NotionAdapter - Bidirectional Notion database integration
 * Supports reading and writing account plans, customer intelligence, alerts, and action items
 * Uses Notion MCP server for authenticated API access
 */

import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'
import {
  NotionAccountPlanSchema,
  NotionCustomerIntelligenceSchema,
  NotionAlertSchema,
  NotionActionItemSchema,
  type NotionAccountPlan,
  type NotionCustomerIntelligence,
  type NotionAlert,
  type NotionActionItem,
  type NotionConfig,
  type NotionBatchWriteRequest,
  type NotionBatchWriteResponse,
  type NotionSyncStatus,
  type NotionDatabaseQueryResponse,
  type NotionPageCreateRequest,
  type NotionPageUpdateRequest,
} from '@/lib/types/notion'
import { getCacheManager, CACHE_TTL } from '@/lib/cache/manager'

/**
 * NotionAdapter - Bidirectional sync with Notion databases
 */
export class NotionAdapter implements DataAdapter {
  name = 'notion'

  private config: NotionConfig | null = null
  private cache = getCacheManager()
  private degraded = false
  private notionApiVersion = '2022-06-28'
  private notionApiUrl = 'https://api.notion.com/v1'

  constructor() {
    // Load config from environment
    this.loadConfig()
  }

  /**
   * Load Notion configuration from environment variables
   */
  private loadConfig(): void {
    const apiKey = process.env.NOTION_API_KEY

    if (!apiKey) {
      console.warn('[NotionAdapter] NOTION_API_KEY not configured - adapter running in degraded mode')
      this.degraded = true
      return
    }

    this.config = {
      apiKey,
      databases: {
        accountPlans: process.env.NOTION_DATABASE_ACCOUNT_PLANS,
        customers: process.env.NOTION_DATABASE_CUSTOMERS,
        alerts: process.env.NOTION_DATABASE_ALERTS,
        actionItems: process.env.NOTION_DATABASE_ACTION_ITEMS,
        intelligence: process.env.NOTION_DATABASE_INTELLIGENCE,
      },
    }
  }

  /**
   * Connect: Verify API key exists and test connection
   */
  async connect(): Promise<Result<void, Error>> {
    if (!this.config?.apiKey) {
      console.warn('[NotionAdapter] NOTION_API_KEY not configured - adapter running in degraded mode')
      this.degraded = true
      return ok(undefined) // Not a failure, just degraded
    }

    // Test connection by fetching user info
    try {
      const response = await fetch(`${this.notionApiUrl}/users/me`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Notion API authentication failed: ${error}`)
      }

      console.log('[NotionAdapter] Connected successfully')
      this.degraded = false
      return ok(undefined)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[NotionAdapter] Connection failed:', errorMessage)
      this.degraded = true
      return err(new Error(`Notion connection failed: ${errorMessage}`))
    }
  }

  /**
   * Query data from Notion databases
   */
  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    if (this.degraded || !this.config) {
      return err(new Error('NOTION_API_KEY not configured - cannot query Notion'))
    }

    const { type, filters } = query

    switch (type) {
      case 'customers':
        return await this.queryCustomers(filters?.customerName)
      default:
        return err(new Error(`Notion adapter does not support query type '${type}'`))
    }
  }

  /**
   * Health check - return true if API key configured and connection working
   */
  async healthCheck(): Promise<boolean> {
    if (this.degraded || !this.config) {
      return false
    }

    try {
      const response = await fetch(`${this.notionApiUrl}/users/me`, {
        headers: this.getHeaders(),
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Disconnect - cleanup resources
   */
  async disconnect(): Promise<void> {
    console.log('[NotionAdapter] Disconnected')
  }

  // ===== READ OPERATIONS =====

  /**
   * Read account plan from Notion
   */
  async readAccountPlan(accountName: string): Promise<Result<NotionAccountPlan | null, Error>> {
    if (this.degraded || !this.config) {
      return err(new Error('NOTION_API_KEY not configured'))
    }

    const databaseId = this.config.databases.accountPlans
    if (!databaseId) {
      return err(new Error('NOTION_DATABASE_ACCOUNT_PLANS not configured'))
    }

    try {
      const pages = await this.queryDatabase(databaseId, {
        property: 'Account Name',
        title: {
          equals: accountName,
        },
      })

      if (pages.length === 0) {
        return ok(null)
      }

      const accountPlan = this.parseAccountPlanFromPage(pages[0])
      return ok(accountPlan)
    } catch (error) {
      return err(new Error(`Failed to read account plan: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }

  /**
   * Read customer intelligence from Notion
   */
  async readCustomerIntelligence(accountName: string): Promise<Result<NotionCustomerIntelligence | null, Error>> {
    if (this.degraded || !this.config) {
      return err(new Error('NOTION_API_KEY not configured'))
    }

    const databaseId = this.config.databases.intelligence
    if (!databaseId) {
      return err(new Error('NOTION_DATABASE_INTELLIGENCE not configured'))
    }

    try {
      const pages = await this.queryDatabase(databaseId, {
        property: 'Account Name',
        title: {
          equals: accountName,
        },
      })

      if (pages.length === 0) {
        return ok(null)
      }

      const intelligence = this.parseIntelligenceFromPage(pages[0])
      return ok(intelligence)
    } catch (error) {
      return err(new Error(`Failed to read intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }

  /**
   * Read alerts for an account from Notion
   */
  async readAlerts(accountName: string, status?: string): Promise<Result<NotionAlert[], Error>> {
    if (this.degraded || !this.config) {
      return err(new Error('NOTION_API_KEY not configured'))
    }

    const databaseId = this.config.databases.alerts
    if (!databaseId) {
      return err(new Error('NOTION_DATABASE_ALERTS not configured'))
    }

    try {
      const filter: Record<string, unknown> = {
        property: 'Account Name',
        title: {
          equals: accountName,
        },
      }

      // Add status filter if provided
      if (status) {
        filter.and = [
          filter,
          {
            property: 'Status',
            select: {
              equals: status,
            },
          },
        ]
      }

      const pages = await this.queryDatabase(databaseId, filter)
      const alerts = pages.map((page) => this.parseAlertFromPage(page))

      return ok(alerts)
    } catch (error) {
      return err(new Error(`Failed to read alerts: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }

  /**
   * Read action items for an account from Notion
   */
  async readActionItems(accountName: string, status?: string): Promise<Result<NotionActionItem[], Error>> {
    if (this.degraded || !this.config) {
      return err(new Error('NOTION_API_KEY not configured'))
    }

    const databaseId = this.config.databases.actionItems
    if (!databaseId) {
      return err(new Error('NOTION_DATABASE_ACTION_ITEMS not configured'))
    }

    try {
      const filter: Record<string, unknown> = {
        property: 'Account Name',
        title: {
          equals: accountName,
        },
      }

      if (status) {
        filter.and = [
          filter,
          {
            property: 'Status',
            select: {
              equals: status,
            },
          },
        ]
      }

      const pages = await this.queryDatabase(databaseId, filter)
      const actionItems = pages.map((page) => this.parseActionItemFromPage(page))

      return ok(actionItems)
    } catch (error) {
      return err(new Error(`Failed to read action items: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }

  // ===== WRITE OPERATIONS =====

  /**
   * Write or update account plan in Notion
   */
  async writeAccountPlan(accountPlan: NotionAccountPlan): Promise<Result<string, Error>> {
    if (this.degraded || !this.config) {
      return err(new Error('NOTION_API_KEY not configured'))
    }

    const databaseId = this.config.databases.accountPlans
    if (!databaseId) {
      return err(new Error('NOTION_DATABASE_ACCOUNT_PLANS not configured'))
    }

    try {
      const properties = this.buildAccountPlanProperties(accountPlan)

      // Check if page exists
      if (accountPlan.id) {
        // Update existing page
        await this.updatePage(accountPlan.id, properties)
        console.log(`[NotionAdapter] Updated account plan: ${accountPlan.accountName}`)
        return ok(accountPlan.id)
      } else {
        // Create new page
        const pageId = await this.createPage(databaseId, properties)
        console.log(`[NotionAdapter] Created account plan: ${accountPlan.accountName}`)
        return ok(pageId)
      }
    } catch (error) {
      return err(new Error(`Failed to write account plan: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }

  /**
   * Write or update customer intelligence in Notion
   */
  async writeCustomerIntelligence(intelligence: NotionCustomerIntelligence): Promise<Result<string, Error>> {
    if (this.degraded || !this.config) {
      return err(new Error('NOTION_API_KEY not configured'))
    }

    const databaseId = this.config.databases.intelligence
    if (!databaseId) {
      return err(new Error('NOTION_DATABASE_INTELLIGENCE not configured'))
    }

    try {
      const properties = this.buildIntelligenceProperties(intelligence)

      if (intelligence.id) {
        await this.updatePage(intelligence.id, properties)
        console.log(`[NotionAdapter] Updated intelligence: ${intelligence.accountName}`)
        return ok(intelligence.id)
      } else {
        const pageId = await this.createPage(databaseId, properties)
        console.log(`[NotionAdapter] Created intelligence: ${intelligence.accountName}`)
        return ok(pageId)
      }
    } catch (error) {
      return err(new Error(`Failed to write intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }

  /**
   * Write or update alert in Notion
   */
  async writeAlert(alert: NotionAlert): Promise<Result<string, Error>> {
    if (this.degraded || !this.config) {
      return err(new Error('NOTION_API_KEY not configured'))
    }

    const databaseId = this.config.databases.alerts
    if (!databaseId) {
      return err(new Error('NOTION_DATABASE_ALERTS not configured'))
    }

    try {
      const properties = this.buildAlertProperties(alert)

      if (alert.id) {
        await this.updatePage(alert.id, properties)
        console.log(`[NotionAdapter] Updated alert: ${alert.title}`)
        return ok(alert.id)
      } else {
        const pageId = await this.createPage(databaseId, properties)
        console.log(`[NotionAdapter] Created alert: ${alert.title}`)
        return ok(pageId)
      }
    } catch (error) {
      return err(new Error(`Failed to write alert: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }

  /**
   * Write or update action item in Notion
   */
  async writeActionItem(actionItem: NotionActionItem): Promise<Result<string, Error>> {
    if (this.degraded || !this.config) {
      return err(new Error('NOTION_API_KEY not configured'))
    }

    const databaseId = this.config.databases.actionItems
    if (!databaseId) {
      return err(new Error('NOTION_DATABASE_ACTION_ITEMS not configured'))
    }

    try {
      const properties = this.buildActionItemProperties(actionItem)

      if (actionItem.id) {
        await this.updatePage(actionItem.id, properties)
        console.log(`[NotionAdapter] Updated action item: ${actionItem.title}`)
        return ok(actionItem.id)
      } else {
        const pageId = await this.createPage(databaseId, properties)
        console.log(`[NotionAdapter] Created action item: ${actionItem.title}`)
        return ok(pageId)
      }
    } catch (error) {
      return err(new Error(`Failed to write action item: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }

  /**
   * Batch write multiple records to Notion
   */
  async batchWrite(request: NotionBatchWriteRequest): Promise<Result<NotionBatchWriteResponse, Error>> {
    const response: NotionBatchWriteResponse = {
      accountPlans: { lastSync: new Date().toISOString(), recordsSynced: 0, recordsCreated: 0, recordsUpdated: 0, errors: [] },
      intelligence: { lastSync: new Date().toISOString(), recordsSynced: 0, recordsCreated: 0, recordsUpdated: 0, errors: [] },
      alerts: { lastSync: new Date().toISOString(), recordsSynced: 0, recordsCreated: 0, recordsUpdated: 0, errors: [] },
      actionItems: { lastSync: new Date().toISOString(), recordsSynced: 0, recordsCreated: 0, recordsUpdated: 0, errors: [] },
    }

    // Process account plans
    if (request.accountPlans) {
      for (const plan of request.accountPlans) {
        const result = await this.writeAccountPlan(plan)
        if (result.success) {
          response.accountPlans.recordsSynced++
          response.accountPlans.recordsCreated += plan.id ? 0 : 1
          response.accountPlans.recordsUpdated += plan.id ? 1 : 0
        } else {
          response.accountPlans.errors.push({
            recordName: plan.accountName,
            error: result.error.message,
          })
        }
      }
    }

    // Process intelligence
    if (request.intelligence) {
      for (const intel of request.intelligence) {
        const result = await this.writeCustomerIntelligence(intel)
        if (result.success) {
          response.intelligence.recordsSynced++
          response.intelligence.recordsCreated += intel.id ? 0 : 1
          response.intelligence.recordsUpdated += intel.id ? 1 : 0
        } else {
          response.intelligence.errors.push({
            recordName: intel.accountName,
            error: result.error.message,
          })
        }
      }
    }

    // Process alerts
    if (request.alerts) {
      for (const alert of request.alerts) {
        const result = await this.writeAlert(alert)
        if (result.success) {
          response.alerts.recordsSynced++
          response.alerts.recordsCreated += alert.id ? 0 : 1
          response.alerts.recordsUpdated += alert.id ? 1 : 0
        } else {
          response.alerts.errors.push({
            recordName: alert.accountName,
            error: result.error.message,
          })
        }
      }
    }

    // Process action items
    if (request.actionItems) {
      for (const item of request.actionItems) {
        const result = await this.writeActionItem(item)
        if (result.success) {
          response.actionItems.recordsSynced++
          response.actionItems.recordsCreated += item.id ? 0 : 1
          response.actionItems.recordsUpdated += item.id ? 1 : 0
        } else {
          response.actionItems.errors.push({
            recordName: item.accountName,
            error: result.error.message,
          })
        }
      }
    }

    return ok(response)
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Get headers for Notion API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config?.apiKey}`,
      'Notion-Version': this.notionApiVersion,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Query a Notion database
   */
  private async queryDatabase(
    databaseId: string,
    filter?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>> {
    const requestBody: Record<string, unknown> = {}
    if (filter) {
      requestBody.filter = filter
    }

    const response = await fetch(`${this.notionApiUrl}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Notion database query failed: ${error}`)
    }

    const data: NotionDatabaseQueryResponse = await response.json()
    return data.results
  }

  /**
   * Create a new page in a Notion database
   */
  private async createPage(databaseId: string, properties: Record<string, unknown>): Promise<string> {
    const requestBody: NotionPageCreateRequest = {
      parent: {
        database_id: databaseId,
      },
      properties,
    }

    const response = await fetch(`${this.notionApiUrl}/pages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Notion page creation failed: ${error}`)
    }

    const data = await response.json()
    return data.id
  }

  /**
   * Update an existing page in Notion
   */
  private async updatePage(pageId: string, properties: Record<string, unknown>): Promise<void> {
    const requestBody: NotionPageUpdateRequest = {
      properties,
    }

    const response = await fetch(`${this.notionApiUrl}/pages/${pageId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Notion page update failed: ${error}`)
    }
  }

  /**
   * Query customers (for adapter interface compatibility)
   */
  private async queryCustomers(customerName?: string): Promise<Result<DataResult, Error>> {
    if (!customerName) {
      return err(new Error('Customer name required for Notion customer query'))
    }

    const accountPlanResult = await this.readAccountPlan(customerName)

    if (!accountPlanResult.success) {
      return err(accountPlanResult.error)
    }

    return ok({
      data: accountPlanResult.data ? [accountPlanResult.data] : [],
      source: this.name,
      timestamp: new Date(),
      count: accountPlanResult.data ? 1 : 0,
    })
  }

  // ===== PROPERTY BUILDERS =====

  private buildAccountPlanProperties(plan: NotionAccountPlan): Record<string, unknown> {
    return {
      'Account Name': {
        title: [{ text: { content: plan.accountName } }],
      },
      'Business Unit': {
        select: { name: plan.businessUnit },
      },
      'Status': {
        select: { name: plan.accountStatus },
      },
      'Health Score': {
        number: plan.healthScore,
      },
      'ARR': {
        number: plan.arr,
      },
      'Executive Summary': {
        rich_text: [{ text: { content: plan.executiveSummary.substring(0, 2000) } }],
      },
      'Churn Risk': {
        select: { name: plan.churnRisk },
      },
      'Last Updated': {
        date: { start: plan.lastUpdated },
      },
    }
  }

  private buildIntelligenceProperties(intelligence: NotionCustomerIntelligence): Record<string, unknown> {
    return {
      'Account Name': {
        title: [{ text: { content: intelligence.accountName } }],
      },
      'Industry Insights': {
        rich_text: [{ text: { content: intelligence.industryInsights.substring(0, 2000) } }],
      },
      'Overall Sentiment': {
        select: { name: intelligence.overallSentiment },
      },
      'Relevance Score': {
        number: intelligence.relevanceScore,
      },
      'Last Fetched': {
        date: { start: intelligence.lastFetched },
      },
      'Source': {
        rich_text: [{ text: { content: intelligence.source } }],
      },
    }
  }

  private buildAlertProperties(alert: NotionAlert): Record<string, unknown> {
    return {
      'Account Name': {
        title: [{ text: { content: alert.accountName } }],
      },
      'Alert Type': {
        select: { name: alert.alertType },
      },
      'Severity': {
        select: { name: alert.severity },
      },
      'Title': {
        rich_text: [{ text: { content: alert.title } }],
      },
      'Description': {
        rich_text: [{ text: { content: alert.description.substring(0, 2000) } }],
      },
      'Status': {
        select: { name: alert.status },
      },
      'Priority': {
        number: alert.priority,
      },
      'Created At': {
        date: { start: alert.createdAt },
      },
    }
  }

  private buildActionItemProperties(item: NotionActionItem): Record<string, unknown> {
    return {
      'Account Name': {
        title: [{ text: { content: item.accountName } }],
      },
      'Title': {
        rich_text: [{ text: { content: item.title } }],
      },
      'Description': {
        rich_text: [{ text: { content: item.description.substring(0, 2000) } }],
      },
      'Category': {
        select: { name: item.category },
      },
      'Status': {
        select: { name: item.status },
      },
      'Assigned To': {
        rich_text: [{ text: { content: item.assignedTo } }],
      },
      'Priority': {
        select: { name: item.priority },
      },
      'Created At': {
        date: { start: item.createdAt },
      },
    }
  }

  // ===== PROPERTY PARSERS =====

  private parseAccountPlanFromPage(page: Record<string, unknown>): NotionAccountPlan {
    const props = page.properties as Record<string, unknown>

    return {
      id: page.id as string,
      accountName: this.extractTitle(props['Account Name']),
      businessUnit: this.extractSelect(props['Business Unit']) as 'Cloudsense' | 'Kandy' | 'STL',
      accountStatus: this.extractSelect(props['Status']) as 'active' | 'at_risk' | 'growth' | 'maintenance',
      healthScore: this.extractNumber(props['Health Score']) || 0,
      arr: this.extractNumber(props['ARR']) || 0,
      executiveSummary: this.extractRichText(props['Executive Summary']),
      strategicInitiatives: [],
      keyContacts: [],
      churnRisk: this.extractSelect(props['Churn Risk']) as 'low' | 'medium' | 'high',
      lastUpdated: this.extractDate(props['Last Updated']) || new Date().toISOString(),
    }
  }

  private parseIntelligenceFromPage(page: Record<string, unknown>): NotionCustomerIntelligence {
    const props = page.properties as Record<string, unknown>

    return {
      id: page.id as string,
      accountName: this.extractTitle(props['Account Name']),
      industryInsights: this.extractRichText(props['Industry Insights']),
      overallSentiment: this.extractSelect(props['Overall Sentiment']) as 'positive' | 'neutral' | 'negative',
      relevanceScore: this.extractNumber(props['Relevance Score']) || 0,
      lastFetched: this.extractDate(props['Last Fetched']) || new Date().toISOString(),
      source: this.extractRichText(props['Source']),
      newsArticles: [],
    }
  }

  private parseAlertFromPage(page: Record<string, unknown>): NotionAlert {
    const props = page.properties as Record<string, unknown>

    return {
      id: page.id as string,
      accountName: this.extractTitle(props['Account Name']),
      alertType: this.extractSelect(props['Alert Type']) as NotionAlert['alertType'],
      severity: this.extractSelect(props['Severity']) as 'low' | 'medium' | 'high' | 'critical',
      title: this.extractRichText(props['Title']),
      description: this.extractRichText(props['Description']),
      status: this.extractSelect(props['Status']) as NotionAlert['status'],
      priority: this.extractNumber(props['Priority']) || 5,
      createdAt: this.extractDate(props['Created At']) || new Date().toISOString(),
    }
  }

  private parseActionItemFromPage(page: Record<string, unknown>): NotionActionItem {
    const props = page.properties as Record<string, unknown>

    return {
      id: page.id as string,
      accountName: this.extractTitle(props['Account Name']),
      title: this.extractRichText(props['Title']),
      description: this.extractRichText(props['Description']),
      category: this.extractSelect(props['Category']) as NotionActionItem['category'],
      status: this.extractSelect(props['Status']) as NotionActionItem['status'],
      assignedTo: this.extractRichText(props['Assigned To']),
      priority: this.extractSelect(props['Priority']) as 'low' | 'medium' | 'high' | 'urgent',
      createdAt: this.extractDate(props['Created At']) || new Date().toISOString(),
      createdBy: 'system',
    }
  }

  // ===== NOTION PROPERTY EXTRACTORS =====

  private extractTitle(prop: unknown): string {
    if (!prop || typeof prop !== 'object') return ''
    const titleProp = prop as { title?: Array<{ plain_text?: string }> }
    return titleProp.title?.[0]?.plain_text || ''
  }

  private extractRichText(prop: unknown): string {
    if (!prop || typeof prop !== 'object') return ''
    const richTextProp = prop as { rich_text?: Array<{ plain_text?: string }> }
    return richTextProp.rich_text?.map((t) => t.plain_text).join('') || ''
  }

  private extractSelect(prop: unknown): string {
    if (!prop || typeof prop !== 'object') return ''
    const selectProp = prop as { select?: { name?: string } }
    return selectProp.select?.name || ''
  }

  private extractNumber(prop: unknown): number | null {
    if (!prop || typeof prop !== 'object') return null
    const numberProp = prop as { number?: number }
    return numberProp.number ?? null
  }

  private extractDate(prop: unknown): string | null {
    if (!prop || typeof prop !== 'object') return null
    const dateProp = prop as { date?: { start?: string } }
    return dateProp.date?.start || null
  }

  /**
   * Get adapter status
   */
  getStatus() {
    return {
      connected: !this.degraded,
      degraded: this.degraded,
      apiKeyConfigured: !!this.config?.apiKey,
      databases: this.config?.databases || {},
    }
  }
}
