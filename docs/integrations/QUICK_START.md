# Notion Integration - Quick Start Guide

Get up and running with Notion integration in 5 minutes.

## Step 1: Get Your Notion API Key

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in:
   - **Name**: `Skyvera Integration`
   - **Workspace**: Select your workspace
   - **Capabilities**: ✓ Read content, ✓ Update content, ✓ Insert content
4. Click **"Submit"**
5. Copy the **Internal Integration Token** (starts with `secret_`)

## Step 2: Configure Environment

Add to your `.env` file:

```bash
NOTION_API_KEY=secret_your_token_here
```

That's the minimum! For full functionality, also add:

```bash
NOTION_DATABASE_ACCOUNT_PLANS=your_database_id
NOTION_DATABASE_CUSTOMERS=your_database_id
NOTION_DATABASE_ALERTS=your_database_id
NOTION_DATABASE_ACTION_ITEMS=your_database_id
NOTION_DATABASE_INTELLIGENCE=your_database_id
```

## Step 3: Create Notion Databases

### Option A: Quick Template (Recommended)

Use this [Notion Template](https://notion.so/templates/skyvera-integration) (if available)

### Option B: Manual Creation

Create a database with these properties:

**Account Plans Database**:
- Account Name (Title)
- Business Unit (Select: Cloudsense, Kandy, STL)
- Status (Select: active, at_risk, growth, maintenance)
- Health Score (Number)
- ARR (Number)
- Executive Summary (Text)
- Churn Risk (Select: low, medium, high)
- Last Updated (Date)

See [notion.md](./notion.md#database-schemas) for complete schemas.

## Step 4: Share Databases with Integration

For each database:

1. Open the database page in Notion
2. Click **"..."** (top right corner)
3. Click **"Add connections"**
4. Find and select **"Skyvera Integration"**
5. Click **"Confirm"**

## Step 5: Get Database IDs

1. Open your database in Notion
2. Copy the page URL
3. Extract the database ID:
   ```
   https://www.notion.so/workspace/DATABASE_ID?v=view_id
                                   ^^^^^^^^^^^
                                   This part!
   ```
4. Add to your `.env`:
   ```bash
   NOTION_DATABASE_ACCOUNT_PLANS=abc123def456...
   ```

## Step 6: Test the Integration

```typescript
import { getConnectorFactory } from '@/lib/data/registry/connector-factory'
import type { NotionAdapter } from '@/lib/data/adapters/external/notion'

// Get the Notion adapter
const factory = await getConnectorFactory()
const notion = factory.getAdapter('notion') as NotionAdapter

// Check status
const status = notion.getStatus()
console.log('Connected:', status.connected)
console.log('Degraded:', status.degraded)

// Test health
const healthy = await notion.healthCheck()
console.log('Healthy:', healthy)
```

Or run the test suite:

```typescript
import { runNotionTests } from '@/lib/data/adapters/external/notion-test'
await runNotionTests()
```

## Step 7: Start Using It!

### Read from Notion

```typescript
const plan = await notion.readAccountPlan('Telstra')

if (plan.success && plan.data) {
  console.log('ARR:', plan.data.arr)
  console.log('Health Score:', plan.data.healthScore)
}
```

### Write to Notion

```typescript
await notion.writeAccountPlan({
  accountName: 'Telstra',
  businessUnit: 'Cloudsense',
  accountStatus: 'active',
  healthScore: 85,
  arr: 6500000,
  executiveSummary: 'Our largest customer...',
  strategicInitiatives: ['Expand usage', 'Upsell to Premium'],
  keyContacts: [
    { name: 'John Smith', role: 'CTO', email: 'john@telstra.com' }
  ],
  churnRisk: 'low',
  lastUpdated: new Date().toISOString()
})
```

### Batch Write

```typescript
await notion.batchWrite({
  accountPlans: [plan1, plan2, plan3],
  alerts: [alert1, alert2],
  actionItems: [task1, task2]
})
```

## Common Use Cases

### 1. Sync Account to Notion

```typescript
import { syncAccountToNotion } from '@/lib/data/adapters/external/notion-examples'

await syncAccountToNotion('Telstra', {
  businessUnit: 'Cloudsense',
  healthScore: 85,
  arr: 6500000,
  status: 'active',
  churnRisk: 'low',
  executiveSummary: 'Strategic partner...',
  strategicInitiatives: ['Cloud migration', 'API integration'],
  keyContacts: [{ name: 'Jane Doe', role: 'VP Engineering' }]
})
```

### 2. Create Risk Alert

```typescript
import { createRiskAlerts } from '@/lib/data/adapters/external/notion-examples'

await createRiskAlerts('Telstra', 45, {
  arAging: 120,
  usageDecline: 35,
  supportTickets: 8,
  executiveEngagement: false
})
```

### 3. Generate Action Items

```typescript
import { generateActionItemsFromAlerts } from '@/lib/data/adapters/external/notion-examples'

await generateActionItemsFromAlerts('Telstra')
```

## Troubleshooting

### "Notion not configured"

✓ Check `NOTION_API_KEY` is set in `.env`
✓ Restart your dev server

### "Database query failed"

✓ Verify database ID is correct (32 characters)
✓ Ensure database is shared with integration
✓ Check property names match exactly

### "Rate limit exceeded"

✓ Use batch operations instead of individual writes
✓ Implement caching
✓ Add delays between requests

## Next Steps

- Read the [complete documentation](./notion.md)
- Explore [example workflows](../src/lib/data/adapters/external/notion-examples.ts)
- Check the [integration hub](./README.md)

## Support

Need help? Check:
- [Complete Notion Documentation](./notion.md)
- [Integration README](./README.md)
- Adapter status: `notion.getStatus()`

---

**That's it!** You're ready to sync Skyvera data with Notion. Happy integrating!
