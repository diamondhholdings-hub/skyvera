# Notion Integration Documentation

The Skyvera Notion integration provides **bidirectional sync** between your Skyvera platform and Notion databases. This enables seamless collaboration, strategic planning, and operational tracking using Notion as your workspace.

## Overview

The Notion adapter supports:
- **Account Plans** - Strategic account planning and health tracking
- **Customer Intelligence** - OSINT data, news, and competitive insights
- **Alerts** - Automated risk alerts and opportunity notifications
- **Action Items** - Task management and follow-up tracking

All operations support both **read** (importing from Notion) and **write** (exporting to Notion).

## Architecture

The Notion integration follows the Skyvera adapter pattern:

```
src/lib/data/adapters/external/notion.ts  → NotionAdapter implementation
src/lib/types/notion.ts                   → Type definitions and schemas
src/lib/data/registry/connector-factory.ts → Adapter registration
```

### Key Features

1. **Graceful Degradation**: Adapter runs in degraded mode if Notion is not configured
2. **Type Safety**: Full Zod schema validation for all data structures
3. **Batch Operations**: Efficient bulk writes for large datasets
4. **Caching**: Intelligent caching to minimize API calls
5. **Error Handling**: Comprehensive error messages and status tracking

## Configuration

### 1. Create Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name: `Skyvera Integration`
4. Capabilities: Read content, Update content, Insert content
5. Copy the **Internal Integration Token**

### 2. Set Environment Variables

Add to your `.env` file:

```bash
# Notion API Key (required)
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database IDs (optional - configure as needed)
NOTION_DATABASE_ACCOUNT_PLANS=32_char_database_id
NOTION_DATABASE_CUSTOMERS=32_char_database_id
NOTION_DATABASE_ALERTS=32_char_database_id
NOTION_DATABASE_ACTION_ITEMS=32_char_database_id
NOTION_DATABASE_INTELLIGENCE=32_char_database_id
```

### 3. Get Notion Database IDs

To find a database ID:

1. Open the database in Notion
2. Click **"Copy link"** (top right)
3. Extract the ID from the URL:
   ```
   https://www.notion.so/<workspace>/<DATABASE_ID>?v=<view_id>
   ```
4. Use the 32-character `DATABASE_ID` value

### 4. Share Databases with Integration

For each database you want to sync:

1. Open the database page in Notion
2. Click **"..."** (top right) → **"Add connections"**
3. Select **"Skyvera Integration"**
4. Click **"Confirm"**

## Database Schemas

### Account Plans Database

Create a Notion database with these properties:

| Property Name       | Type        | Options                                    |
|---------------------|-------------|--------------------------------------------|
| Account Name        | Title       | -                                          |
| Business Unit       | Select      | Cloudsense, Kandy, STL                     |
| Status              | Select      | active, at_risk, growth, maintenance       |
| Health Score        | Number      | 0-100                                      |
| ARR                 | Number      | Annual Recurring Revenue                   |
| Executive Summary   | Text        | Rich text                                  |
| Churn Risk          | Select      | low, medium, high                          |
| Renewal Date        | Date        | -                                          |
| Last Updated        | Date        | -                                          |

### Customer Intelligence Database

| Property Name       | Type        | Options                                    |
|---------------------|-------------|--------------------------------------------|
| Account Name        | Title       | -                                          |
| Industry Insights   | Text        | Rich text                                  |
| Overall Sentiment   | Select      | positive, neutral, negative                |
| Relevance Score     | Number      | 0-1                                        |
| Last Fetched        | Date        | -                                          |
| Source              | Text        | -                                          |

### Alerts Database

| Property Name       | Type        | Options                                    |
|---------------------|-------------|--------------------------------------------|
| Account Name        | Title       | -                                          |
| Alert Type          | Select      | churn_risk, growth_opportunity, renewal_upcoming, negative_news, payment_overdue |
| Severity            | Select      | low, medium, high, critical                |
| Title               | Text        | -                                          |
| Description         | Text        | Rich text                                  |
| Status              | Select      | open, acknowledged, in_progress, resolved, dismissed |
| Priority            | Number      | 1-10                                       |
| Created At          | Date        | -                                          |
| Assigned To         | Text        | -                                          |

### Action Items Database

| Property Name       | Type        | Options                                    |
|---------------------|-------------|--------------------------------------------|
| Account Name        | Title       | -                                          |
| Title               | Text        | -                                          |
| Description         | Text        | Rich text                                  |
| Category            | Select      | followup, renewal, upsell, risk_mitigation, onboarding, support |
| Status              | Select      | todo, in_progress, blocked, completed, cancelled |
| Assigned To         | Text        | -                                          |
| Priority            | Select      | low, medium, high, urgent                  |
| Due Date            | Date        | -                                          |
| Created At          | Date        | -                                          |
| Created By          | Text        | -                                          |

## Usage Examples

### Reading from Notion

#### Read Account Plan

```typescript
import { getConnectorFactory } from '@/lib/data/registry/connector-factory'
import type { NotionAdapter } from '@/lib/data/adapters/external/notion'

const factory = await getConnectorFactory()
const notion = factory.getAdapter('notion') as NotionAdapter

const result = await notion.readAccountPlan('Telstra')

if (result.success && result.data) {
  console.log('Account Plan:', result.data)
  console.log('Health Score:', result.data.healthScore)
  console.log('ARR:', result.data.arr)
}
```

#### Read Alerts

```typescript
// Get all open alerts for an account
const alertsResult = await notion.readAlerts('Telstra', 'open')

if (alertsResult.success) {
  console.log('Open Alerts:', alertsResult.data)

  alertsResult.data.forEach((alert) => {
    console.log(`[${alert.severity}] ${alert.title}`)
  })
}
```

#### Read Action Items

```typescript
// Get all pending action items
const itemsResult = await notion.readActionItems('Telstra', 'todo')

if (itemsResult.success) {
  console.log('Pending Action Items:', itemsResult.data)
}
```

### Writing to Notion

#### Create/Update Account Plan

```typescript
import type { NotionAccountPlan } from '@/lib/types/notion'

const accountPlan: NotionAccountPlan = {
  // id: undefined, // Omit for new record
  accountName: 'Telstra',
  businessUnit: 'Cloudsense',
  accountStatus: 'active',
  healthScore: 85,
  arr: 6500000,
  executiveSummary: 'Telstra is our largest Cloudsense customer...',
  strategicInitiatives: [
    'Expand to additional business units',
    'Migrate legacy systems to cloud',
  ],
  keyContacts: [
    {
      name: 'John Smith',
      role: 'CTO',
      email: 'john.smith@telstra.com',
    },
  ],
  churnRisk: 'low',
  renewalDate: '2026-12-31',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system',
}

const result = await notion.writeAccountPlan(accountPlan)

if (result.success) {
  console.log('Account plan saved with ID:', result.data)
}
```

#### Create Alert

```typescript
import type { NotionAlert } from '@/lib/types/notion'

const alert: NotionAlert = {
  accountName: 'Telstra',
  alertType: 'renewal_upcoming',
  severity: 'high',
  title: 'Contract renewal in 90 days',
  description: 'Telstra contract expires on 2026-12-31. Begin renewal discussions.',
  status: 'open',
  priority: 8,
  createdAt: new Date().toISOString(),
}

await notion.writeAlert(alert)
```

#### Create Action Item

```typescript
import type { NotionActionItem } from '@/lib/types/notion'

const actionItem: NotionActionItem = {
  accountName: 'Telstra',
  title: 'Schedule QBR with CTO',
  description: 'Quarterly business review to discuss roadmap and priorities',
  category: 'followup',
  status: 'todo',
  assignedTo: 'john.doe@skyvera.com',
  priority: 'high',
  dueDate: '2026-03-01',
  createdAt: new Date().toISOString(),
  createdBy: 'system',
}

await notion.writeActionItem(actionItem)
```

### Batch Operations

```typescript
import type { NotionBatchWriteRequest } from '@/lib/types/notion'

// Sync multiple records at once
const batchRequest: NotionBatchWriteRequest = {
  accountPlans: [plan1, plan2, plan3],
  alerts: [alert1, alert2],
  actionItems: [item1, item2, item3],
}

const batchResult = await notion.batchWrite(batchRequest)

if (batchResult.success) {
  console.log('Account Plans Synced:', batchResult.data.accountPlans.recordsSynced)
  console.log('Alerts Synced:', batchResult.data.alerts.recordsSynced)
  console.log('Action Items Synced:', batchResult.data.actionItems.recordsSynced)

  // Check for errors
  if (batchResult.data.alerts.errors.length > 0) {
    console.error('Alert sync errors:', batchResult.data.alerts.errors)
  }
}
```

## Integration with ConnectorFactory

The Notion adapter is automatically registered with the ConnectorFactory:

```typescript
import { getConnectorFactory } from '@/lib/data/registry/connector-factory'

const factory = await getConnectorFactory()

// Check adapter status
const status = factory.getAdapterStatus()
console.log('Notion status:', status.get('notion'))

// Get Notion adapter directly
const notion = factory.getAdapter('notion')
```

## API Endpoints

### Create Notion Sync API Route

Example: `/src/app/api/notion/sync/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getConnectorFactory } from '@/lib/data/registry/connector-factory'
import type { NotionAdapter } from '@/lib/data/adapters/external/notion'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountName } = body

    const factory = await getConnectorFactory()
    const notion = factory.getAdapter('notion') as NotionAdapter

    // Read account plan from Notion
    const planResult = await notion.readAccountPlan(accountName)

    if (!planResult.success) {
      return NextResponse.json(
        { error: planResult.error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      accountPlan: planResult.data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

## Common Workflows

### Workflow 1: Push Account Intelligence to Notion

```typescript
async function syncAccountToNotion(accountName: string) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  // 1. Fetch account data from internal systems
  const accountData = await fetchAccountData(accountName)

  // 2. Push to Notion
  const accountPlan: NotionAccountPlan = {
    accountName: accountData.name,
    businessUnit: accountData.bu,
    accountStatus: accountData.status,
    healthScore: accountData.healthScore,
    arr: accountData.arr,
    executiveSummary: accountData.summary,
    strategicInitiatives: accountData.initiatives,
    keyContacts: accountData.contacts,
    churnRisk: accountData.churnRisk,
    lastUpdated: new Date().toISOString(),
  }

  await notion.writeAccountPlan(accountPlan)

  // 3. Create alerts if needed
  if (accountData.churnRisk === 'high') {
    const alert: NotionAlert = {
      accountName,
      alertType: 'churn_risk',
      severity: 'critical',
      title: 'High churn risk detected',
      description: `Account health score: ${accountData.healthScore}/100`,
      status: 'open',
      priority: 9,
      createdAt: new Date().toISOString(),
    }
    await notion.writeAlert(alert)
  }
}
```

### Workflow 2: Import Strategic Context from Notion

```typescript
async function importStrategicContext(accountName: string) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  // Read account plan from Notion
  const planResult = await notion.readAccountPlan(accountName)

  if (planResult.success && planResult.data) {
    // Use strategic context in analysis
    const context = {
      summary: planResult.data.executiveSummary,
      initiatives: planResult.data.strategicInitiatives,
      contacts: planResult.data.keyContacts,
    }

    // Pass to Claude for intelligence generation
    return context
  }

  return null
}
```

### Workflow 3: Automated Action Item Creation

```typescript
async function createFollowupTasks(accountName: string, alerts: NotionAlert[]) {
  const factory = await getConnectorFactory()
  const notion = factory.getAdapter('notion') as NotionAdapter

  const actionItems: NotionActionItem[] = []

  for (const alert of alerts) {
    if (alert.severity === 'high' || alert.severity === 'critical') {
      const item: NotionActionItem = {
        accountName,
        title: `Follow up on: ${alert.title}`,
        description: alert.description,
        category: 'risk_mitigation',
        status: 'todo',
        assignedTo: 'csm-team@skyvera.com',
        priority: alert.severity === 'critical' ? 'urgent' : 'high',
        dueDate: getNextBusinessDay(),
        createdAt: new Date().toISOString(),
        createdBy: 'automation',
      }
      actionItems.push(item)
    }
  }

  // Batch create action items
  const batchResult = await notion.batchWrite({ actionItems })

  return batchResult
}
```

## Error Handling

The Notion adapter provides comprehensive error handling:

```typescript
const result = await notion.writeAccountPlan(accountPlan)

if (!result.success) {
  const error = result.error

  // Check error type
  if (error.message.includes('not configured')) {
    console.log('Notion not configured - running in degraded mode')
  } else if (error.message.includes('authentication failed')) {
    console.error('Invalid Notion API key')
  } else if (error.message.includes('database query failed')) {
    console.error('Database not shared with integration')
  } else {
    console.error('Notion error:', error.message)
  }
}
```

## Health Checks

Monitor Notion integration health:

```typescript
const factory = await getConnectorFactory()

// Overall health check
const health = await factory.healthCheck()
const notionHealthy = health.get('notion')

console.log('Notion healthy:', notionHealthy)

// Detailed status
const notion = factory.getAdapter('notion') as NotionAdapter
const status = notion.getStatus()

console.log('API Key Configured:', status.apiKeyConfigured)
console.log('Connected:', status.connected)
console.log('Degraded:', status.degraded)
console.log('Databases:', status.databases)
```

## Best Practices

### 1. Graceful Degradation

Always handle the case where Notion is not configured:

```typescript
const factory = await getConnectorFactory()
const notion = factory.getAdapter('notion') as NotionAdapter

if (notion.getStatus().degraded) {
  console.log('Notion not configured - skipping sync')
  return
}

// Proceed with Notion operations
```

### 2. Batch Operations

Use batch writes for efficiency:

```typescript
// Good: Single batch request
await notion.batchWrite({
  accountPlans: [plan1, plan2, plan3],
  alerts: [alert1, alert2],
})

// Avoid: Multiple individual writes
await notion.writeAccountPlan(plan1)
await notion.writeAccountPlan(plan2)
await notion.writeAccountPlan(plan3)
```

### 3. Error Recovery

Handle partial failures in batch operations:

```typescript
const result = await notion.batchWrite(batchRequest)

if (result.success) {
  const { accountPlans, alerts } = result.data

  // Log successes
  console.log(`Synced ${accountPlans.recordsSynced} account plans`)

  // Handle errors
  if (accountPlans.errors.length > 0) {
    for (const error of accountPlans.errors) {
      console.error(`Failed to sync ${error.recordName}: ${error.error}`)
      // Retry logic here
    }
  }
}
```

### 4. Caching

The adapter uses intelligent caching. Leverage it:

```typescript
// First call hits API
const result1 = await notion.readAccountPlan('Telstra')

// Subsequent calls use cache (within TTL)
const result2 = await notion.readAccountPlan('Telstra')
```

## Troubleshooting

### "NOTION_API_KEY not configured"

- Check `.env` file has `NOTION_API_KEY` set
- Restart your dev server after adding the key

### "Notion database query failed"

- Verify the database ID is correct (32 characters)
- Ensure the database is shared with your integration:
  - Open database → "..." → "Add connections" → Select your integration

### "Notion API authentication failed"

- Your API key may be invalid or expired
- Create a new integration key from [Notion Integrations](https://www.notion.so/my-integrations)

### Database Schema Mismatch

- Ensure your Notion database properties match the schemas above
- Property names are case-sensitive
- Select options must exactly match (e.g., "low" not "Low")

### Rate Limits

Notion API rate limits:
- **3 requests per second** per integration

If you hit rate limits:
- Use batch operations instead of individual writes
- Implement exponential backoff for retries
- Leverage caching

## Security Considerations

1. **Never commit API keys**: Keep `.env` in `.gitignore`
2. **Rotate keys regularly**: Generate new integration keys periodically
3. **Limit permissions**: Only grant necessary capabilities to your integration
4. **Audit database access**: Review which databases are shared with the integration

## Roadmap

Future enhancements:

- [ ] Two-way sync with conflict resolution
- [ ] Webhook support for real-time updates
- [ ] Notion blocks API for rich content
- [ ] Advanced filtering and search
- [ ] Automated database schema creation
- [ ] Notion formulas and rollups support

## Support

For issues or questions:
- Check the [Notion API Documentation](https://developers.notion.com/)
- Review the adapter source code: `/src/lib/data/adapters/external/notion.ts`
- Check adapter status: `notion.getStatus()`
