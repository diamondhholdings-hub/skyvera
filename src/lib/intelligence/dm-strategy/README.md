# DM% Strategy Engine

AI-powered revenue retention recommendation system for Skyvera accounts.

## Overview

The DM% Strategy Engine analyzes customer accounts to identify revenue retention risks and growth opportunities, then generates creative, account-specific recommendations to improve DM% (Decline/Maintenance Rate).

**DM% = (Projected ARR / Current ARR) × 100**

- Target: 90% minimum (retain at least 90% of revenue)
- Current: Cloudsense 94.7%, Kandy 97.8%, STL 122%, Consolidated 97.4%

## Architecture

```
dm-strategy/
├── types.ts              # TypeScript types and Zod schemas
├── analyzer.ts           # Account and portfolio analysis
├── recommender.ts        # Claude-powered recommendation generator
├── impact-calculator.ts  # Financial modeling
├── prioritizer.ts        # Recommendation ranking and sorting
└── index.ts             # Main exports
```

## Core Components

### 1. Analyzer (`analyzer.ts`)

Analyzes accounts for DM% risks and opportunities.

```typescript
import { analyzeAccount, analyzePortfolio } from '@/lib/intelligence/dm-strategy'

// Analyze single account
const result = await analyzeAccount('Telstra Corporation')
if (result.success) {
  const analysis = result.value
  console.log(`Current DM%: ${analysis.currentDM}%`)
  console.log(`At Risk: ${analysis.atRisk}`)
  console.log(`Recommendations: ${analysis.recommendations.length}`)
}

// Analyze entire portfolio or BU
const portfolioResult = await analyzePortfolio('Cloudsense')
```

**Key Functions:**
- `analyzeAccount(accountName)` - Deep dive single account
- `analyzePortfolio(bu?)` - Analyze all accounts or by BU
- `identifyAtRiskAccounts(bu?)` - Find declining DM% or low health
- `identifyGrowthOpportunities(bu?)` - Find expansion candidates

### 2. Recommender (`recommender.ts`)

Uses Claude to generate creative, account-specific recommendations.

```typescript
import { generateRecommendations } from '@/lib/intelligence/dm-strategy'

const recommendations = await generateRecommendations(accountName, context)
```

**Recommendation Types:**
- `pricing` - Price optimization (increases or strategic discounts)
- `product_enhancement` - Feature/capability additions
- `account_intervention` - CSM actions, executive engagement
- `upsell` - Expansion opportunities
- `contract_restructure` - Multi-year deals, commitment tiers
- `competitive_defense` - Counter competitive threats
- `churn_prevention` - Immediate retention actions
- `portfolio_optimization` - Resource allocation improvements

### 3. Impact Calculator (`impact-calculator.ts`)

Financial modeling for recommendation impacts.

```typescript
import { projectScenario, calculateROI } from '@/lib/intelligence/dm-strategy'

// Project "what if all recommendations accepted"
const projection = await projectScenario(recommendations, 'Cloudsense')

// Calculate ROI
const roi = calculateROI(recommendation, estimatedCost)
```

**Key Functions:**
- `calculateARRImpact(recommendation)` - Model revenue impact
- `calculateDMImpact(recommendation, currentARR)` - Model DM% change
- `projectScenario(recommendations[], bu?)` - Portfolio-level projection
- `calculateROI(recommendation, cost)` - Return on investment
- `calculatePaybackPeriod(recommendation, cost)` - Months to recover cost

### 4. Prioritizer (`prioritizer.ts`)

Ranks recommendations by impact/effort ROI.

```typescript
import { prioritizeRecommendations, getTopRecommendations } from '@/lib/intelligence/dm-strategy'

// Prioritize by score
const prioritized = prioritizeRecommendations(recommendations)

// Get top N recommendations
const top5 = getTopRecommendations(recommendations, 5)
```

**Priority Formula:**
```
Score = (ARR Impact × 0.4) + (Confidence × 0.3) + (Urgency × 0.2) + (Ease × 0.1)
```

**Priority Levels:**
- `critical` - Score >= 80
- `high` - Score >= 60
- `medium` - Score >= 40
- `low` - Score < 40

## API Routes

### `POST /api/dm-strategy/analyze`

Analyze all accounts and generate recommendations.

```bash
curl -X POST http://localhost:3000/api/dm-strategy/analyze \
  -H "Content-Type: application/json" \
  -d '{"bu": "Cloudsense"}'
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "runId": "run-1234567890",
    "bu": "Cloudsense",
    "totalAccounts": 50,
    "accountsAnalyzed": 50,
    "currentDM": 94.7,
    "projectedDM": 94.7,
    "atRiskAccounts": 5,
    "totalARRAtRisk": 500000,
    "growthAccounts": 15,
    "totalRecommendations": 87,
    "projectedARRImpact": 1250000,
    "projectedDMImprovement": 3.2
  }
}
```

### `POST /api/dm-strategy/analyze-account`

Analyze single account.

```bash
curl -X POST http://localhost:3000/api/dm-strategy/analyze-account \
  -H "Content-Type: application/json" \
  -d '{"accountName": "Telstra Corporation"}'
```

### `GET /api/dm-strategy/recommendations`

Fetch all recommendations with optional filters.

```bash
# All pending recommendations
curl http://localhost:3000/api/dm-strategy/recommendations?status=pending

# Critical priority only
curl http://localhost:3000/api/dm-strategy/recommendations?priority=critical

# Specific account
curl http://localhost:3000/api/dm-strategy/recommendations?accountName=Telstra%20Corporation
```

### `POST /api/dm-strategy/accept-recommendation`

Accept a recommendation and optionally create an action item.

```bash
curl -X POST http://localhost:3000/api/dm-strategy/accept-recommendation \
  -H "Content-Type: application/json" \
  -d '{"recommendationId": "rec-123", "createActionItem": true}'
```

### `POST /api/dm-strategy/defer-recommendation`

Defer a recommendation with a reason.

```bash
curl -X POST http://localhost:3000/api/dm-strategy/defer-recommendation \
  -H "Content-Type: application/json" \
  -d '{"recommendationId": "rec-123", "reason": "Waiting for Q3 budget approval"}'
```

### `GET /api/dm-strategy/impact-calculator`

Calculate projected impact of accepted recommendations.

```bash
curl http://localhost:3000/api/dm-strategy/impact-calculator?status=accepted&bu=Cloudsense
```

## Database Schema

### `DMRecommendation`

```prisma
model DMRecommendation {
  id                  Int      @id @default(autoincrement())
  recommendationId    String   @unique @default(cuid())
  accountName         String
  bu                  String
  type                String
  priority            String
  title               String
  description         String
  reasoning           String
  arrImpact           Float
  dmImpact            Float
  marginImpact        Float
  confidenceLevel     Int
  timeline            String
  ownerTeam           String
  risk                String
  status              String   @default("pending")
  deferredReason      String?
  linkedActionItemId  String?
  createdAt           DateTime @default(now())
  acceptedAt          DateTime?
  completedAt         DateTime?
}
```

### `DMAnalysisRun`

```prisma
model DMAnalysisRun {
  id                       Int      @id @default(autoincrement())
  runId                    String   @unique @default(cuid())
  runDate                  DateTime @default(now())
  accountsAnalyzed         Int
  recommendationsGenerated Int
  totalPotentialARR        Float
  totalPotentialDM         Float
  status                   String
  error                    String?
  bu                       String?
}
```

## Example Recommendations

### Pricing Optimization
```
Title: "Increase Telstra pricing by 15% with 90-day notice"
Type: pricing
ARR Impact: +$120,000
DM Impact: +1.5%
Confidence: 87%
Reasoning: "Telstra's pricing is 22% below market rate for similar enterprise
           deployments. Strong relationship (green health score) and high usage
           patterns indicate low churn risk. Competitor analysis shows
           comparable solutions priced $800K+ annually."
```

### Competitive Defense
```
Title: "Deploy EU edge nodes for British Telecom before Q3'26 renewal"
Type: competitive_defense
ARR Impact: +$850,000 (prevented churn)
DM Impact: +8.5%
Confidence: 92%
Reasoning: "British Telecom cited latency concerns in last QBR and is
           evaluating regional competitors. Deployment cost $120K, payback
           2 months. Renewal in Q3'26 gives us 4-month runway."
```

### Contract Restructure
```
Title: "Convert Vodafone to 3-year contract with 10% discount"
Type: contract_restructure
ARR Impact: -$32,000 (year 1) / +$288,000 (3-year)
DM Impact: +12%
Confidence: 78%
Reasoning: "Vodafone is on annual contract with quarterly uncertainty.
           3-year commit increases DM stability dramatically. Strategic
           discount acceptable given reduced CAC and improved forecasting."
```

## Testing

Run the test script to validate the engine:

```bash
npx tsx scripts/test-dm-strategy.ts
```

This will:
1. Analyze a sample account (Telstra Corporation)
2. Analyze the Cloudsense portfolio
3. Generate recommendations
4. Project scenario impact

## Migration

Apply Prisma migrations to add the database tables:

```bash
npx prisma migrate dev --name add-dm-strategy-engine
npx prisma generate
```

## Best Practices

1. **Run Regular Analysis:** Schedule weekly portfolio analysis to catch emerging risks early

2. **Prioritize Critical Items:** Focus on critical/high priority recommendations first

3. **Track Outcomes:** Mark recommendations as accepted/completed to build ML training data

4. **Validate Assumptions:** Use Claude's reasoning field to understand recommendation logic

5. **Combine Signals:** Cross-reference DM recommendations with account intelligence, health scores, and competitive data

6. **Monitor Impact:** Use impact calculator to track actual vs projected outcomes

## Integration Points

The DM Strategy Engine integrates with:

- **Customer Database** - Account ARR, subscriptions, health scores
- **Account Intelligence** - 7-tab account plans (stakeholders, pain points, competitors)
- **Financial Data** - Revenue tracking, margin analysis
- **Action Items** - Convert accepted recommendations to trackable actions
- **Claude AI** - Creative recommendation generation via orchestrator

## Future Enhancements

- [ ] Historical trend analysis (3-month, 6-month DM% trajectories)
- [ ] Pricing optimization ML model (predict optimal price points)
- [ ] Renewal date extraction from Excel/Salesforce
- [ ] A/B testing framework for recommendations
- [ ] Success rate tracking and ML feedback loop
- [ ] Integration with Notion for automatic action item creation
- [ ] Slack notifications for critical recommendations
- [ ] Executive dashboard with DM% visualizations
