# POST /api/query

Natural language query processing powered by Claude AI.

## Endpoint

```
POST /api/query
```

## Description

Interprets natural language questions about financial data, customer metrics, and business intelligence. Uses Claude Sonnet 4.5 with semantic understanding of business terms (RR, ARR, NRR, EBITDA, etc.).

## Request

### Headers

```
Content-Type: application/json
```

### Body Schema

```typescript
{
  query: string                    // Natural language question
  filters?: {                      // Optional filters
    bu?: string                    // Business unit: "Cloudsense" | "Kandy" | "STL"
    healthScore?: string           // Customer health: "Healthy" | "At Risk" | "Critical"
    minRevenue?: number            // Minimum revenue filter
    maxRevenue?: number            // Maximum revenue filter
  }
  conversationContext?: Array<{    // Optional conversation history
    role: "user" | "assistant"
    content: string
  }>
  cannedQueryId?: string           // Optional canned query ID
}
```

### Example Request

```json
{
  "query": "Which customers have ARR over $500K and are at risk of churning?",
  "filters": {
    "bu": "Cloudsense",
    "healthScore": "At Risk"
  },
  "conversationContext": []
}
```

### Using Canned Queries

```json
{
  "cannedQueryId": "top-customers-by-revenue",
  "filters": {
    "bu": "Cloudsense",
    "limit": 10
  }
}
```

## Response

### Success (200 OK)

```json
{
  "query": "Which customers have ARR over $500K and are at risk of churning?",
  "response": {
    "type": "answer",
    "answer": "Based on the current data, there are 3 Cloudsense customers with ARR over $500K that are at risk:\n\n1. **Telstra Corporation** - $1.2M ARR, Health Score: At Risk\n   - Late payments (AR > 90 days: $180K)\n   - Recent support ticket volume spike (+40%)\n   - Contract renewal in Q2'26\n\n2. **Vodafone Netherlands** - $680K ARR, Health Score: At Risk\n   - Usage declining (-15% QoQ)\n   - New CTO joined 2 months ago\n   - Competitive eval in progress\n\n3. **British Telecom** - $520K ARR, Health Score: Critical\n   - Contract in renewal discussion\n   - Price increase pushback\n   - High churn probability (75%)\n\nTotal at-risk ARR: $2.4M\n\n**Recommended Actions:**\n- Schedule executive review with Telstra within 2 weeks\n- Initiate QBR with Vodafone's new CTO\n- Escalate BT to retention team immediately",
    "confidence": "high",
    "dataPoints": 3,
    "sources": ["customer_database", "subscription_data", "health_scoring"]
  },
  "timestamp": "2026-02-12T10:30:00.000Z"
}
```

### Clarification Needed (200 OK)

```json
{
  "query": "Show me the numbers",
  "response": {
    "type": "clarification",
    "question": "I can help you with several types of numbers. Could you be more specific?",
    "suggestions": [
      "Total revenue across all business units",
      "Top customers by ARR",
      "Recurring revenue (RR) breakdown",
      "Net margin and EBITDA figures",
      "Customer count by health score"
    ]
  },
  "timestamp": "2026-02-12T10:30:00.000Z"
}
```

### Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "query",
      "message": "Query must be at least 3 characters"
    }
  ]
}
```

### Error (500 Internal Server Error)

```json
{
  "error": "Query interpretation failed",
  "message": "ANTHROPIC_API_KEY not configured"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | The processed query (expanded from template if canned query) |
| `response.type` | string | Response type: "answer" or "clarification" |
| `response.answer` | string | Markdown-formatted answer (if type=answer) |
| `response.confidence` | string | Confidence level: "high", "medium", "low" |
| `response.dataPoints` | number | Number of data points analyzed |
| `response.sources` | string[] | Data sources used |
| `response.question` | string | Clarification question (if type=clarification) |
| `response.suggestions` | string[] | Suggested follow-up queries |
| `timestamp` | string | ISO 8601 timestamp |

## Available Canned Queries

| ID | Description | Required Filters |
|----|-------------|------------------|
| `top-customers-by-revenue` | Top N customers by total revenue | `limit` (default: 20) |
| `at-risk-customers` | Customers with health issues | `bu` (optional) |
| `revenue-by-bu` | Revenue breakdown by business unit | None |
| `churn-analysis` | Upcoming renewals and churn risk | `quarter` (optional) |
| `expansion-opportunities` | Accounts with upsell potential | `minARR` (optional) |

## Semantic Understanding

The system understands these business terms:

### Financial Metrics
- **RR**: Recurring Revenue (subscription-based)
- **NRR**: Non-Recurring Revenue (one-time)
- **ARR**: Annual Recurring Revenue (RR × 4)
- **MRR**: Monthly Recurring Revenue (RR / 3)
- **EBITDA**: Earnings before interest, taxes, depreciation, amortization
- **Net Margin**: (Revenue - Costs) / Revenue
- **Gross Margin**: (Revenue - COGS) / Revenue

### Customer Metrics
- **Health Score**: Calculated from payment history, usage, engagement
- **Churn Risk**: Probability of non-renewal
- **ARR at Risk**: Total ARR from at-risk customers
- **Customer Lifetime Value (CLV)**: Projected long-term revenue

### Business Units
- **Cloudsense**: Largest BU (~$8M/quarter)
- **Kandy**: Mid-size BU (~$3.3M/quarter)
- **STL**: Smaller BU (~$1M/quarter)

## Usage Examples

### Example 1: Top Customers Query

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me the top 10 customers by ARR in Cloudsense",
    "filters": { "bu": "Cloudsense" }
  }'
```

### Example 2: Financial Analysis

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is our net margin and how does it compare to the target?"
  }'
```

### Example 3: Conversational Context

```javascript
const conversationHistory = [
  { role: "user", content: "Which customers are in the Kandy business unit?" },
  { role: "assistant", content: "Kandy has 42 customers with total ARR of $3.3M..." }
]

const response = await fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Which of those are at risk?",
    conversationContext: conversationHistory
  })
})
```

## Performance

- **Cold start**: 2-5 seconds (first Claude API call)
- **Cached response**: < 100ms
- **Warm request**: 1-3 seconds
- **Complex queries**: 3-8 seconds

Responses are cached for 15 minutes based on query + filters hash.

## Best Practices

1. **Be specific**: "Top 5 customers by ARR" vs "Show me customers"
2. **Use filters**: Narrow down results for faster responses
3. **Provide context**: Use conversationContext for follow-up questions
4. **Check confidence**: Low confidence responses may need refinement
5. **Handle clarifications**: Present suggestions to user for better UX

## Rate Limits

- **Claude API**: 60 requests/minute (handled by orchestrator)
- **Recommended per-user**: 10 queries/minute

## Notes

- Queries are processed asynchronously but appear synchronous to client
- Cache is shared across all users (consider per-user caching for production)
- Requires `ANTHROPIC_API_KEY` in environment
- Responses are in Markdown format for rich formatting
