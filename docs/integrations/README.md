# Skyvera External Integrations

This directory contains documentation for all external data integrations supported by the Skyvera platform.

## Available Integrations

### 1. Notion Database Integration

**Status**: Production Ready
**Type**: Bidirectional Sync
**Documentation**: [notion.md](./notion.md)

Seamlessly sync account plans, customer intelligence, alerts, and action items between Skyvera and Notion databases.

**Key Features**:
- Bidirectional read/write capabilities
- Batch operations for efficiency
- Graceful degradation if not configured
- Full type safety with Zod schemas
- Intelligent caching

**Use Cases**:
- Strategic account planning in Notion
- Collaborative task management
- Real-time alert notifications
- Executive reporting and dashboards

**Quick Start**:
```bash
# 1. Set environment variables in .env
NOTION_API_KEY=your_api_key
NOTION_DATABASE_ACCOUNT_PLANS=your_database_id

# 2. Use in your code
import { getConnectorFactory } from '@/lib/data/registry/connector-factory'
import type { NotionAdapter } from '@/lib/data/adapters/external/notion'

const factory = await getConnectorFactory()
const notion = factory.getAdapter('notion') as NotionAdapter

const result = await notion.readAccountPlan('Telstra')
```

See [notion.md](./notion.md) for complete documentation.

---

### 2. NewsAPI Integration

**Status**: Production Ready
**Type**: Read-only
**Documentation**: See `/src/lib/data/adapters/external/newsapi.ts`

Fetches real-time business news and intelligence using NewsAPI.ai.

**Key Features**:
- Real-time news article fetching
- Aggressive caching (100 req/day free tier)
- Customer-specific news filtering
- Sentiment analysis ready

**Quick Start**:
```bash
# Set environment variable
NEWSAPI_KEY=your_api_key

# Use via ConnectorFactory
const factory = await getConnectorFactory()
const result = await factory.getData('newsapi', {
  type: 'news',
  filters: { customerName: 'Telstra', limit: 5 }
})
```

---

### 3. Excel Data Adapter

**Status**: Production Ready
**Type**: Read-only
**Documentation**: See `/src/lib/data/adapters/excel/`

Parses Skyvera's master budget Excel file for financial analysis.

**Key Features**:
- P&L statement parsing
- Recurring Revenue (RR) analysis
- Non-Recurring Revenue (NRR) tracking
- Vendor cost analysis
- AR aging reports

**Quick Start**:
```typescript
const factory = await getConnectorFactory()
const result = await factory.getData('excel', {
  type: 'financials',
  filters: { bu: 'Cloudsense', quarter: 'Q1\'26' }
})
```

---

## Integration Architecture

All adapters follow the same base interface pattern:

```typescript
interface DataAdapter {
  name: string
  connect(): Promise<Result<void, Error>>
  query(query: AdapterQuery): Promise<Result<DataResult, Error>>
  healthCheck(): Promise<boolean>
  disconnect(): Promise<void>
}
```

### Adapter Lifecycle

1. **Registration**: Adapters register with `ConnectorFactory` on initialization
2. **Connection**: Each adapter runs `connect()` to validate credentials
3. **Query**: Adapters respond to `query()` calls with typed data
4. **Health Monitoring**: Regular `healthCheck()` calls ensure availability
5. **Cleanup**: `disconnect()` called on shutdown

### Graceful Degradation

All adapters support graceful degradation:

- **Connected**: Full functionality, all API calls work
- **Degraded**: Adapter initialized but API key missing or invalid
- **Failed**: Adapter initialization failed (critical error)

```typescript
const factory = await getConnectorFactory()
const status = factory.getAdapterStatus()

console.log('Notion:', status.get('notion')) // 'connected', 'degraded', or 'failed'
```

## Adding New Integrations

To add a new integration:

### 1. Create Type Definitions

Create `/src/lib/types/your-integration.ts`:

```typescript
import { z } from 'zod'

export const YourDataSchema = z.object({
  // Define your schema
})
export type YourData = z.infer<typeof YourDataSchema>
```

### 2. Implement Adapter

Create `/src/lib/data/adapters/external/your-integration.ts`:

```typescript
import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'

export class YourAdapter implements DataAdapter {
  name = 'your-integration'

  async connect(): Promise<Result<void, Error>> {
    // Initialize connection
  }

  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    // Handle queries
  }

  async healthCheck(): Promise<boolean> {
    // Check health
  }

  async disconnect(): Promise<void> {
    // Cleanup
  }
}
```

### 3. Register Adapter

Update `/src/lib/data/registry/connector-factory.ts`:

```typescript
import { YourAdapter } from '../adapters/external/your-integration'

// In getConnectorFactory():
instance.register(new YourAdapter())
```

### 4. Add Configuration

Update `.env.example`:

```bash
# Your Integration
YOUR_INTEGRATION_API_KEY=your_api_key
```

### 5. Create Documentation

Create `docs/integrations/your-integration.md` with:
- Overview and features
- Configuration instructions
- Database schemas (if applicable)
- Usage examples
- Troubleshooting guide

## Testing Integrations

### Unit Tests

Create tests in `/tests/adapters/your-integration.test.ts`:

```typescript
import { YourAdapter } from '@/lib/data/adapters/external/your-integration'

describe('YourAdapter', () => {
  it('should connect successfully', async () => {
    const adapter = new YourAdapter()
    const result = await adapter.connect()
    expect(result.success).toBe(true)
  })
})
```

### Integration Tests

Test with live APIs:

```typescript
import { testYourIntegration } from '@/lib/data/adapters/external/your-integration-test'

await testYourIntegration()
```

## Best Practices

### 1. Error Handling

Always use Result types:

```typescript
const result = await adapter.query(query)

if (!result.success) {
  console.error('Query failed:', result.error.message)
  return
}

const data = result.data
```

### 2. Caching

Use the cache manager for expensive operations:

```typescript
import { getCacheManager, CACHE_TTL } from '@/lib/cache/manager'

const cache = getCacheManager()
const data = await cache.get(
  'cache-key',
  async () => {
    return await expensiveOperation()
  },
  { ttl: CACHE_TTL.NEWS }
)
```

### 3. Type Safety

Always validate external data with Zod:

```typescript
const validationResult = YourDataSchema.safeParse(externalData)

if (!validationResult.success) {
  console.error('Validation failed:', validationResult.error)
  return
}

const validData = validationResult.data
```

### 4. Rate Limiting

Respect API rate limits:

```typescript
// Use batch operations
await adapter.batchWrite({ items: [item1, item2, item3] })

// Add exponential backoff for retries
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(Math.pow(2, i) * 1000)
    }
  }
  throw new Error('Max retries exceeded')
}
```

### 5. Monitoring

Monitor adapter health:

```typescript
const factory = await getConnectorFactory()
const health = await factory.healthCheck()

health.forEach((isHealthy, adapterName) => {
  if (!isHealthy) {
    console.error(`${adapterName} is unhealthy`)
    // Alert monitoring system
  }
})
```

## Configuration Management

### Environment Variables

All integration configurations are managed via environment variables:

- `.env.example`: Template with all available options
- `.env.local`: Local development overrides
- `.env`: Production configuration (gitignored)

### Secrets Management

**Never commit API keys to git!**

For production:
1. Use environment variable injection
2. Store secrets in secure vault (e.g., AWS Secrets Manager)
3. Rotate keys regularly
4. Use separate keys for dev/staging/production

## Troubleshooting

### Common Issues

**"Adapter not initialized"**
- Ensure `getConnectorFactory()` is called before using adapters
- Check that adapter is registered in `connector-factory.ts`

**"API key not configured"**
- Verify environment variable is set in `.env`
- Restart dev server after adding keys
- Check variable naming matches exactly

**"Database query failed"**
- For Notion: Ensure database is shared with integration
- For all APIs: Verify API key has correct permissions
- Check network connectivity

**"Rate limit exceeded"**
- Implement caching to reduce API calls
- Use batch operations instead of individual calls
- Add exponential backoff for retries

### Debug Mode

Enable debug logging:

```typescript
// Set in .env
DEBUG=true

// Or in code
process.env.DEBUG = 'true'
```

## Roadmap

### Planned Integrations

- [ ] Salesforce CRM (bidirectional)
- [ ] Google Sheets (read/write)
- [ ] Slack notifications (write-only)
- [ ] Microsoft Teams (write-only)
- [ ] Jira issues (bidirectional)
- [ ] GitHub repositories (read-only)
- [ ] LinkedIn company data (read-only)

### Planned Features

- [ ] Webhook support for real-time updates
- [ ] GraphQL support for flexible queries
- [ ] Automatic schema migration
- [ ] Conflict resolution for bidirectional sync
- [ ] Multi-region API support
- [ ] Advanced filtering and search

## Contributing

To contribute a new integration:

1. Follow the adapter pattern above
2. Include comprehensive tests
3. Write detailed documentation
4. Add example usage code
5. Update this README

## Support

For integration support:
- Check adapter status: `getStatus()`
- Review logs for error messages
- Consult individual integration docs
- Check API provider status pages

## License

All integration adapters are proprietary to Skyvera.
