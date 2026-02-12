# POST /api/scenarios/analyze

Scenario impact analysis with financial calculations and Claude-powered strategic insights.

## Endpoint

```
POST /api/scenarios/analyze
```

## Description

Models business scenarios to forecast financial impact:
- Pricing changes (increase/decrease)
- Customer churn
- Expansion/upsell opportunities
- Headcount changes
- Vendor cost optimization

Returns calculated metrics and AI-generated strategic recommendations.

## Request

### Headers

```
Content-Type: application/json
```

### Body Schema

```typescript
{
  scenarioType: "pricing_change" | "churn" | "expansion" | "headcount" | "vendor_optimization"
  targetBU?: string                         // Optional: "Cloudsense" | "Kandy" | "STL" | "All"
  timeframe?: string                        // Optional: "Q1'26" | "Q2'26" | etc.
  assumptions: {
    // For pricing_change:
    priceIncreasePercent?: number           // -100 to 100
    affectedCustomerPercent?: number        // 0 to 100
    expectedChurnRate?: number              // 0 to 100

    // For churn:
    customersLost?: string[]                // Customer names
    churnQuarter?: string                   // "Q2'26"

    // For expansion:
    targetCustomers?: string[]              // Customer names
    expectedUpsellPercent?: number          // 0 to 200
    conversionRate?: number                 // 0 to 100

    // For headcount:
    newHires?: number                       // -50 to 50
    avgSalaryCost?: number                  // Annual cost per hire

    // For vendor_optimization:
    vendorName?: string                     // "Salesforce UK"
    costReductionPercent?: number           // 0 to 100
  }
  description?: string                      // Optional scenario description
}
```

### Example Requests

#### 1. Pricing Change Scenario

```json
{
  "scenarioType": "pricing_change",
  "targetBU": "Cloudsense",
  "timeframe": "Q2'26",
  "assumptions": {
    "priceIncreasePercent": 10,
    "affectedCustomerPercent": 80,
    "expectedChurnRate": 5
  },
  "description": "Model 10% price increase with expected 5% churn"
}
```

#### 2. Churn Scenario

```json
{
  "scenarioType": "churn",
  "assumptions": {
    "customersLost": ["Telstra Corporation", "Vodafone Netherlands"],
    "churnQuarter": "Q2'26"
  },
  "description": "Impact of losing Telstra and Vodafone"
}
```

#### 3. Expansion Scenario

```json
{
  "scenarioType": "expansion",
  "targetBU": "Kandy",
  "assumptions": {
    "targetCustomers": ["AT&T Services", "British Telecom"],
    "expectedUpsellPercent": 25,
    "conversionRate": 75
  },
  "description": "25% upsell to top 2 Kandy customers"
}
```

## Response

### Success (200 OK)

```json
{
  "calculatedMetrics": {
    "baselineRevenue": 8000000,
    "projectedRevenue": 8320000,
    "revenueChange": 320000,
    "revenueChangePercent": 4.0,
    "netMarginChange": -0.8,
    "ebitdaChange": 256000,
    "affectedCustomers": 28,
    "totalCustomers": 35,
    "rrImpact": 280000,
    "nrrImpact": 40000,
    "arrImpact": 1120000,
    "assumptions": {
      "priceIncreasePercent": 10,
      "affectedCustomerPercent": 80,
      "expectedChurnRate": 5
    }
  },
  "claudeAnalysis": {
    "summary": "The 10% price increase on 80% of Cloudsense customers would generate an additional $320K in quarterly revenue, but comes with significant execution risk.",
    "keyInsights": [
      "Revenue upside of $1.12M ARR is material (14% of Cloudsense ARR)",
      "5% churn assumption is conservative; at-risk customers may have higher sensitivity",
      "Net margin improvement partially offset by increased support costs during transition",
      "Implementation timing critical: avoid renewal periods to minimize churn"
    ],
    "risks": [
      {
        "risk": "Competitive vulnerability",
        "severity": "HIGH",
        "mitigation": "Phase rollout starting with healthiest customers; offer value-add features"
      },
      {
        "risk": "Customer concentration",
        "severity": "MEDIUM",
        "mitigation": "Top 5 customers represent 60% of Cloudsense ARR; negotiate separately"
      },
      {
        "risk": "Market perception",
        "severity": "LOW",
        "mitigation": "Position as feature upgrade vs price increase; grandfather existing commitments"
      }
    ],
    "recommendations": [
      {
        "priority": "HIGH",
        "action": "Customer segmentation analysis",
        "rationale": "Identify which customers can absorb 10% increase vs require negotiation",
        "timeline": "2 weeks",
        "owner": "RevOps"
      },
      {
        "priority": "HIGH",
        "action": "Competitive pricing benchmarking",
        "rationale": "Validate pricing vs. competitors to ensure competitive positioning",
        "timeline": "1 week",
        "owner": "Product Marketing"
      },
      {
        "priority": "MEDIUM",
        "action": "Value messaging development",
        "rationale": "Create ROI calculator and case studies to justify price increase",
        "timeline": "3 weeks",
        "owner": "Marketing"
      }
    ],
    "alternativeScenarios": [
      {
        "name": "Tiered pricing approach",
        "description": "5% increase for base tier, 15% for premium tier with new features",
        "expectedOutcome": "Lower churn risk, higher ACV for premium customers"
      },
      {
        "name": "Phased rollout",
        "description": "10% increase starting Q3'26 for new customers only, Q4'26 for renewals",
        "expectedOutcome": "Smoother transition, reduced churn risk"
      }
    ],
    "confidence": "MEDIUM",
    "assumptions": [
      "Assumes product-market fit remains strong",
      "No major competitive launches during implementation",
      "Customer success team can handle increased support load"
    ]
  },
  "baseline": {
    "totalRevenue": 14700000,
    "recurringRevenue": 12600000,
    "nonRecurringRevenue": 2100000,
    "netMargin": 0.625,
    "ebitda": 9200000,
    "customerCount": 140
  }
}
```

### Error (400 Bad Request)

```json
{
  "error": "Invalid scenario input",
  "details": [
    {
      "path": "assumptions.priceIncreasePercent",
      "message": "Must be between -100 and 100"
    }
  ]
}
```

### Error (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "details": "Failed to fetch baseline metrics: Database connection timeout"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `calculatedMetrics.baselineRevenue` | number | Current quarterly revenue |
| `calculatedMetrics.projectedRevenue` | number | Revenue after scenario |
| `calculatedMetrics.revenueChange` | number | Delta ($) |
| `calculatedMetrics.revenueChangePercent` | number | Delta (%) |
| `calculatedMetrics.netMarginChange` | number | Change in net margin (percentage points) |
| `calculatedMetrics.ebitdaChange` | number | Change in EBITDA ($) |
| `calculatedMetrics.affectedCustomers` | number | Number of customers impacted |
| `calculatedMetrics.rrImpact` | number | Impact on recurring revenue |
| `calculatedMetrics.nrrImpact` | number | Impact on non-recurring revenue |
| `calculatedMetrics.arrImpact` | number | Impact on annual recurring revenue |
| `claudeAnalysis` | object | AI-generated strategic analysis (null if Claude unavailable) |
| `claudeAnalysis.summary` | string | Executive summary |
| `claudeAnalysis.keyInsights` | string[] | Main takeaways |
| `claudeAnalysis.risks` | array | Risk assessment with mitigation strategies |
| `claudeAnalysis.recommendations` | array | Prioritized action items |
| `claudeAnalysis.alternativeScenarios` | array | Alternative approaches to consider |
| `claudeAnalysis.confidence` | string | "HIGH" \| "MEDIUM" \| "LOW" |
| `baseline` | object | Current baseline metrics for comparison |

## Calculation Logic

### Pricing Change
```typescript
projectedRevenue = baselineRevenue * (1 + priceIncreasePercent / 100) * (affectedCustomerPercent / 100)
churnImpact = baselineRevenue * (affectedCustomerPercent / 100) * (expectedChurnRate / 100)
netRevenue = projectedRevenue - churnImpact
```

### Churn
```typescript
churnImpact = sum(customer.totalRevenue for customer in customersLost)
projectedRevenue = baselineRevenue - churnImpact
```

### Expansion
```typescript
upsellRevenue = sum(customer.totalRevenue * expectedUpsellPercent / 100 for customer in targetCustomers)
projectedRevenue = baselineRevenue + (upsellRevenue * conversionRate / 100)
```

## Usage Examples

### Example 1: Price Increase Model

```javascript
const analyzePrice = async () => {
  const response = await fetch('/api/scenarios/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenarioType: 'pricing_change',
      targetBU: 'Cloudsense',
      assumptions: {
        priceIncreasePercent: 10,
        affectedCustomerPercent: 80,
        expectedChurnRate: 5
      }
    })
  })

  const result = await response.json()
  console.log('Revenue impact:', result.calculatedMetrics.revenueChange)
  console.log('Claude analysis:', result.claudeAnalysis.summary)
}
```

### Example 2: Churn Impact

```bash
curl -X POST http://localhost:3000/api/scenarios/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioType": "churn",
    "assumptions": {
      "customersLost": ["Telstra Corporation"],
      "churnQuarter": "Q2'26"
    }
  }'
```

### Example 3: Multi-Scenario Comparison

```python
import requests

scenarios = [
    {'priceIncreasePercent': 5, 'expectedChurnRate': 2},
    {'priceIncreasePercent': 10, 'expectedChurnRate': 5},
    {'priceIncreasePercent': 15, 'expectedChurnRate': 10},
]

results = []
for scenario in scenarios:
    response = requests.post(
        'http://localhost:3000/api/scenarios/analyze',
        json={
            'scenarioType': 'pricing_change',
            'targetBU': 'Cloudsense',
            'assumptions': {
                'priceIncreasePercent': scenario['priceIncreasePercent'],
                'affectedCustomerPercent': 100,
                'expectedChurnRate': scenario['expectedChurnRate']
            }
        }
    )
    results.append(response.json())

# Find optimal scenario
optimal = max(results, key=lambda r: r['calculatedMetrics']['revenueChange'])
print(f"Optimal: {optimal['calculatedMetrics']['assumptions']}")
```

## Performance

- **Calculation only**: < 100ms
- **With Claude analysis**: 2-5 seconds
- **Cached**: < 50ms (if identical scenario run before)

## Best Practices

1. **Start conservative**: Use realistic churn assumptions
2. **Segment analysis**: Run scenarios per business unit for precision
3. **Sensitivity testing**: Test multiple assumption sets to find break-even points
4. **Review Claude insights**: AI analysis provides strategic context calculations miss
5. **Document assumptions**: Always include `description` field for audit trail

## Notes

- Claude analysis is optional and won't fail the request if unavailable
- Baseline metrics are fetched from the database in real-time
- Scenarios do not persist to database (stateless analysis)
- Consider creating a `/api/scenarios/save` endpoint for scenario persistence
