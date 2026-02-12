# API Documentation

Complete API reference for the Skyvera Executive Intelligence System.

## Base URL

**Development**: `http://localhost:3000/api`
**Production**: `https://your-domain.com/api`

## Authentication

Currently, the API does not require authentication. For production deployment, consider implementing:
- API key authentication
- OAuth 2.0 for user-based access
- Rate limiting per client

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-02-12T10:30:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": { ... },
  "timestamp": "2026-02-12T10:30:00.000Z"
}
```

## Rate Limiting

- **Claude API Requests**: Automatically rate-limited by the orchestrator (60 requests/minute)
- **Database Queries**: No explicit limit, but protected by connection pooling
- **Recommended**: Implement per-client rate limiting in production

## Available Endpoints

### System

- [GET /api/health](./health.md) - System health check

### Intelligence

- [POST /api/query](./query.md) - Natural language query processing
- [POST /api/scenarios/analyze](./scenarios-analyze.md) - Scenario impact analysis

### Product Agent

- [POST /api/product-agent/analyze](./product-agent-analyze.md) - Pattern detection
- [POST /api/product-agent/generate-prd](./product-agent-generate-prd.md) - PRD generation

### Data Management

- [POST /api/seed](./seed.md) - Seed database from Excel

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Claude API or database down |

## TypeScript Types

All API endpoints use Zod schemas for validation. Import types from:

```typescript
import { nlqRequestSchema } from '@/lib/intelligence/nlq/types'
import { scenarioInputSchema } from '@/lib/intelligence/scenarios/types'
```

## Best Practices

### Caching
- Claude responses are cached automatically (15 minutes for queries, 5 minutes for enrichment)
- Use custom `cacheKey` in requests to control caching behavior
- Clear cache by restarting the server

### Error Handling
- Always check the `success` field in responses
- Implement exponential backoff for 429 errors
- Log errors with request IDs for debugging

### Performance
- Batch related queries when possible
- Use filters to reduce data payload
- Consider pagination for large datasets

## Examples

### cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Natural language query
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me top 5 customers by revenue"}'

# Scenario analysis
curl -X POST http://localhost:3000/api/scenarios/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioType": "churn",
    "targetBU": "Cloudsense",
    "assumptions": {
      "customersLost": ["Telstra", "BT"],
      "churnQuarter": "Q2'26"
    }
  }'
```

### JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Which customers are at risk?',
    filters: { bu: 'Cloudsense' }
  })
})

const data = await response.json()
if (data.success) {
  console.log(data.response)
}
```

### Python

```python
import requests

# Natural language query
response = requests.post(
    'http://localhost:3000/api/query',
    json={
        'query': 'What is our total recurring revenue?',
        'filters': {}
    }
)

result = response.json()
print(result['response'])
```

## Changelog

### v0.1.0 (2026-02-12)
- Initial API release
- Health check endpoint
- Natural language queries
- Scenario modeling
- Product agent system
- Database seeding
