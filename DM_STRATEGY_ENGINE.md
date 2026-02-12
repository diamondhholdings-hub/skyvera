# DM% Strategy Engine - Complete Implementation

**Status:** ✅ PRODUCTION READY

**Purpose:** AI-powered revenue retention recommendation system that analyzes customer accounts, identifies DM% risks/opportunities, and generates creative, account-specific recommendations to maximize revenue retention.

---

## Executive Summary

The DM% Strategy Engine is a complete backend system that:

1. **Analyzes** 140 customer accounts across 4 business units
2. **Identifies** revenue retention risks and growth opportunities
3. **Generates** AI-powered, account-specific recommendations using Claude
4. **Models** financial impact (ARR, DM%, margins)
5. **Prioritizes** recommendations by ROI (impact/effort ratio)
6. **Tracks** recommendation status (pending/accepted/deferred/completed)

**Current Portfolio Metrics:**
- Cloudsense: 94.7% DM%
- Kandy: 97.8% DM%
- STL: 122% DM%
- Consolidated: 97.4% DM%
- Target: 90% minimum DM%

---

## Architecture

### Core Components

```
src/lib/intelligence/dm-strategy/
├── types.ts              # TypeScript types and Zod schemas (17 schemas)
├── analyzer.ts           # Account and portfolio analysis (4 functions)
├── recommender.ts        # Claude-powered recommendation generator (2 functions)
├── impact-calculator.ts  # Financial modeling (8 functions)
├── prioritizer.ts        # Recommendation ranking (6 functions)
├── index.ts             # Main exports
└── README.md            # Detailed documentation
```

### Claude Prompts

```
src/lib/intelligence/claude/prompts/
└── dm-strategy.ts       # System prompt + account/portfolio prompts
```

### API Routes

```
src/app/api/dm-strategy/
├── analyze/route.ts              # POST - Analyze all accounts
├── analyze-account/route.ts      # POST - Analyze single account
├── recommendations/route.ts      # GET - Fetch recommendations (filterable)
├── accept-recommendation/route.ts # POST - Accept recommendation
├── defer-recommendation/route.ts  # POST - Defer recommendation
└── impact-calculator/route.ts     # GET - Calculate projected impact
```

### Database Schema

```prisma
model DMRecommendation {
  id                  Int      @id @default(autoincrement())
  recommendationId    String   @unique @default(cuid())
  accountName         String
  bu                  String
  type                String   // 8 types (pricing, product_enhancement, etc.)
  priority            String   // critical/high/medium/low
  title               String
  description         String
  reasoning           String
  arrImpact           Float
  dmImpact            Float
  marginImpact        Float
  confidenceLevel     Int
  timeline            String   // immediate/short/medium/long-term
  ownerTeam           String   // CSM/Sales/Product/Engineering/Executive/Finance
  risk                String   // high/medium/low
  status              String   @default("pending")
  deferredReason      String?
  linkedActionItemId  String?
  createdAt           DateTime @default(now())
  acceptedAt          DateTime?
  completedAt         DateTime?
}

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

---

## Key Features

### 1. Account Analysis

**Function:** `analyzeAccount(accountName)`

Performs deep-dive analysis of a single account:
- Calculates current DM% from subscription data
- Identifies risk factors (low DM%, health score issues, upcoming renewals)
- Identifies growth opportunities (high health, strong retention)
- Generates 3-5 AI-powered recommendations

**Risk Factors:**
- DM% below 90% target
- Poor health score (red/yellow)
- Upcoming renewals (Q2-Q4)
- Non-renewal flags in subscriptions

**Growth Indicators:**
- Green health score
- DM% > 95%
- High-value account (>$100K revenue)

### 2. Portfolio Analysis

**Function:** `analyzePortfolio(bu?)`

Analyzes entire portfolio or specific BU:
- Aggregates account-level analyses
- Calculates weighted average DM%
- Identifies at-risk accounts and ARR at risk
- Identifies growth accounts and opportunities
- Groups recommendations by type and priority
- Projects total impact if all recommendations accepted

**Output:**
- Total accounts analyzed
- Current vs projected DM%
- At-risk accounts count + ARR at risk
- Growth accounts count + opportunity ARR
- Recommendation summary (by type, priority)
- Projected ARR impact and DM% improvement

### 3. AI-Powered Recommendations

**Function:** `generateRecommendations(accountName, context)`

Uses Claude Sonnet 4.5 to generate creative, account-specific recommendations:

**8 Recommendation Types:**
1. **pricing** - Price optimization (increases or strategic discounts)
2. **product_enhancement** - Feature/capability additions
3. **account_intervention** - CSM actions, executive engagement
4. **upsell** - Expansion opportunities (seats, modules, usage)
5. **contract_restructure** - Multi-year deals, commitment tiers
6. **competitive_defense** - Counter competitive threats
7. **churn_prevention** - Immediate retention actions
8. **portfolio_optimization** - Resource allocation improvements

**Claude Prompt Design:**
- System prompt establishes strategic advisor role
- Account-specific prompt includes full context (ARR, DM%, health, risks, opportunities)
- Enforces JSON output with structured fields
- Mandates specific, creative recommendations (not generic advice)
- Includes financial impact modeling (ARR, DM%, margin, confidence)

**Example Output:**
```json
{
  "type": "competitive_defense",
  "title": "Deploy EU edge nodes for British Telecom before Q3'26 renewal",
  "description": "Install 3 edge nodes in London, Frankfurt, Amsterdam...",
  "reasoning": "British Telecom cited 45ms latency in last QBR...",
  "expectedImpact": {
    "arrImpact": 850000,
    "dmImpact": 8.5,
    "marginImpact": -2.3
  },
  "confidence": 92,
  "timeline": "short-term",
  "ownerTeam": "Engineering",
  "risk": "medium"
}
```

### 4. Financial Impact Modeling

**Functions:**
- `calculateARRImpact(recommendation)` - Adjusts for confidence and risk
- `calculateDMImpact(recommendation, currentARR)` - Models DM% change
- `calculateMarginImpact(recommendation)` - Ensures profitable growth
- `projectScenario(recommendations[], bu?)` - Portfolio-level projection
- `calculateROI(recommendation, cost)` - Return on investment
- `calculatePaybackPeriod(recommendation, cost)` - Months to recover cost

**Impact Adjustments:**
- Confidence multiplier: 0-100% becomes 0-1x
- Risk multiplier: high=0.7x, medium=0.85x, low=1.0x
- Combined: `Impact = BaseImpact × Confidence × Risk`

**Scenario Projection:**
Calculates baseline vs projected metrics:
- Total ARR change ($ and %)
- Average DM% change (pp and %)
- Confidence level (HIGH/MEDIUM/LOW)

### 5. Recommendation Prioritization

**Function:** `prioritizeRecommendations(recommendations)`

**Priority Score Formula:**
```
Score = (ARR Impact × 0.4) + (Confidence × 0.3) + (Urgency × 0.2) + (Ease × 0.1)
```

**Priority Levels:**
- **Critical:** Score >= 80 (highest impact, high confidence, urgent)
- **High:** Score >= 60 (strong impact or urgent)
- **Medium:** Score >= 40 (moderate impact)
- **Low:** Score < 40 (lower impact or long-term)

**Additional Functions:**
- `filterByPriority(recommendations, priority)` - Filter by level(s)
- `getTopRecommendations(recommendations, count)` - Top N by score
- `groupByPriority(recommendations)` - Group into buckets
- `suggestNextActions(recommendations, max)` - Next best actions

---

## API Reference

### POST /api/dm-strategy/analyze

Analyze all accounts or specific BU and generate recommendations.

**Request:**
```json
{
  "bu": "Cloudsense"  // Optional: analyze specific BU
}
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
    "totalARROpportunity": 2100000,
    "totalRecommendations": 87,
    "recommendationsByType": {
      "pricing": 15,
      "upsell": 20,
      "churn_prevention": 12,
      ...
    },
    "recommendationsByPriority": {
      "critical": 8,
      "high": 22,
      "medium": 35,
      "low": 22
    },
    "projectedARRImpact": 1250000,
    "projectedDMImprovement": 3.2,
    "analyzedAt": "2026-02-12T17:30:00Z"
  }
}
```

### POST /api/dm-strategy/analyze-account

Analyze single account.

**Request:**
```json
{
  "accountName": "Telstra Corporation"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "accountName": "Telstra Corporation",
    "bu": "Cloudsense",
    "currentDM": 96.2,
    "projectedDM": 96.2,
    "targetDM": 90,
    "atRisk": false,
    "riskFactors": [],
    "hasGrowthOpportunity": true,
    "opportunityFactors": [
      "Strong health score (green)",
      "High retention rate (96.2%)",
      "High-value account ($850K)"
    ],
    "currentARR": 850000,
    "projectedARRImpact": 127500,
    "recommendations": [...],
    "analyzedAt": "2026-02-12T17:30:00Z"
  }
}
```

### GET /api/dm-strategy/recommendations

Fetch all recommendations with optional filters.

**Query Parameters:**
- `bu` - Filter by business unit
- `priority` - Filter by priority level
- `type` - Filter by recommendation type
- `status` - Filter by status (default: pending)
- `accountName` - Filter by account

**Example:**
```
GET /api/dm-strategy/recommendations?priority=critical&bu=Cloudsense
```

**Response:**
```json
{
  "success": true,
  "recommendations": [...],
  "summary": {
    "total": 87,
    "byPriority": {
      "critical": 8,
      "high": 22,
      "medium": 35,
      "low": 22
    },
    "byType": {...},
    "totalARRImpact": 1250000,
    "totalDMImpact": 15.3,
    "avgConfidence": 82.5
  }
}
```

### POST /api/dm-strategy/accept-recommendation

Accept a recommendation and optionally create an action item.

**Request:**
```json
{
  "recommendationId": "rec-clabcdef123",
  "createActionItem": true  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "recommendation": {...},
  "actionItemId": "action-1234567890",
  "message": "Recommendation accepted and action item created"
}
```

### POST /api/dm-strategy/defer-recommendation

Defer a recommendation with a reason.

**Request:**
```json
{
  "recommendationId": "rec-clabcdef123",
  "reason": "Waiting for Q3 budget approval"
}
```

### GET /api/dm-strategy/impact-calculator

Calculate projected impact of accepted recommendations.

**Query Parameters:**
- `bu` - Filter by business unit
- `status` - Filter by status (default: accepted)

**Response:**
```json
{
  "success": true,
  "projection": {
    "baseline": {
      "totalARR": 8500000,
      "avgDM": 94.7,
      "totalRevenue": 8100000
    },
    "projected": {
      "totalARR": 9750000,
      "avgDM": 97.9,
      "totalRevenue": 9350000
    },
    "impact": {
      "arrChange": 1250000,
      "arrChangePercent": 14.7,
      "dmChange": 3.2,
      "dmChangePercent": 3.4
    },
    "recommendationsIncluded": 45,
    "confidence": "HIGH"
  },
  "recommendationsCount": 45
}
```

---

## Usage Examples

### Example 1: Run Full Portfolio Analysis

```typescript
import { analyzePortfolio } from '@/lib/intelligence/dm-strategy'

// Analyze Cloudsense BU
const result = await analyzePortfolio('Cloudsense')

if (result.success) {
  const portfolio = result.value
  console.log(`Analyzed ${portfolio.accountsAnalyzed} accounts`)
  console.log(`Current DM%: ${portfolio.currentDM.toFixed(1)}%`)
  console.log(`At-Risk Accounts: ${portfolio.atRiskAccounts}`)
  console.log(`Total Recommendations: ${portfolio.totalRecommendations}`)
  console.log(`Projected ARR Impact: $${portfolio.projectedARRImpact.toLocaleString()}`)
}
```

### Example 2: Get Top Recommendations

```typescript
import { analyzePortfolio, getTopRecommendations } from '@/lib/intelligence/dm-strategy'

const portfolioResult = await analyzePortfolio('Cloudsense')
if (portfolioResult.success) {
  const allRecs = portfolioResult.value.accountAnalyses.flatMap(a => a.recommendations)
  const top5 = getTopRecommendations(allRecs, 5)

  top5.forEach(rec => {
    console.log(`[${rec.priority}] ${rec.title}`)
    console.log(`  Account: ${rec.accountName}`)
    console.log(`  ARR Impact: $${rec.impact.arrImpact.toLocaleString()}`)
    console.log(`  Confidence: ${rec.impact.confidenceLevel}%`)
  })
}
```

### Example 3: Project Scenario Impact

```typescript
import { analyzePortfolio, projectScenario } from '@/lib/intelligence/dm-strategy'

const portfolioResult = await analyzePortfolio('Cloudsense')
if (portfolioResult.success) {
  const allRecs = portfolioResult.value.accountAnalyses.flatMap(a => a.recommendations)
  const scenarioResult = await projectScenario(allRecs, 'Cloudsense')

  if (scenarioResult.success) {
    const scenario = scenarioResult.value
    console.log(`If all ${scenario.recommendationsIncluded} recommendations accepted:`)
    console.log(`  ARR Change: $${scenario.impact.arrChange.toLocaleString()}`)
    console.log(`  DM% Change: ${scenario.impact.dmChange.toFixed(1)}pp`)
    console.log(`  Confidence: ${scenario.confidence}`)
  }
}
```

---

## Testing

### Run Test Script

```bash
npx tsx scripts/test-dm-strategy.ts
```

**Test Coverage:**
1. Single account analysis (Telstra Corporation)
2. Portfolio analysis (Cloudsense BU)
3. Recommendation generation
4. Scenario projection

**Expected Output:**
- Account analysis with risk/opportunity assessment
- 3-5 recommendations per account
- Portfolio summary with aggregate metrics
- Scenario projection with baseline vs projected state

---

## Integration Points

### Existing Systems

1. **Customer Database** (`prisma.customer`)
   - Account ARR from subscriptions
   - Health scores (green/yellow/red)
   - Renewal quarters
   - Will renew flags

2. **Account Intelligence** (7-tab system)
   - Stakeholders
   - Pain points
   - Opportunities
   - Competitors
   - Action items
   - Strategy
   - Intelligence reports

3. **Financial Data**
   - Revenue tracking (RR, NRR, Total)
   - Margin analysis
   - BU performance

4. **Claude Orchestrator**
   - Rate limiting
   - Response caching
   - Priority queue
   - Error handling

### Future Integrations

1. **Action Item System**
   - Convert accepted recommendations to trackable actions
   - Link to Notion pages
   - Assign owners and due dates

2. **Notion Sync**
   - Push recommendations to account pages
   - Update retention strategy sections
   - Track completion status

3. **Excel/Salesforce**
   - Extract renewal dates
   - Extract pricing history
   - Sync recommendation outcomes

---

## Deployment Checklist

✅ **Core Engine**
- [x] Types and Zod schemas
- [x] Analyzer (4 functions)
- [x] Recommender (2 functions)
- [x] Impact calculator (8 functions)
- [x] Prioritizer (6 functions)

✅ **Claude Integration**
- [x] System prompt
- [x] Account recommendation prompt
- [x] Portfolio recommendation prompt
- [x] JSON response validation

✅ **API Routes**
- [x] POST /api/dm-strategy/analyze
- [x] POST /api/dm-strategy/analyze-account
- [x] GET /api/dm-strategy/recommendations
- [x] POST /api/dm-strategy/accept-recommendation
- [x] POST /api/dm-strategy/defer-recommendation
- [x] GET /api/dm-strategy/impact-calculator

✅ **Database**
- [x] DMRecommendation model
- [x] DMAnalysisRun model
- [x] Migration applied
- [x] Prisma Client generated

✅ **Documentation**
- [x] README.md
- [x] API reference
- [x] Usage examples
- [x] Integration guide

✅ **Testing**
- [x] Test script
- [x] Sample recommendations
- [x] Error handling

---

## Next Steps

### Phase 1: Production Testing (Week 1)
1. Run analysis on all 140 accounts
2. Review recommendation quality
3. Tune Claude prompts for specificity
4. Validate impact calculations

### Phase 2: UI Integration (Week 2)
1. Create DM Strategy Dashboard
2. Show recommendations by account
3. Accept/defer UI workflow
4. Impact visualization (charts)

### Phase 3: Action Item Integration (Week 3)
1. Link accepted recommendations to action items
2. Auto-create Notion pages
3. Track completion status
4. Measure actual vs projected impact

### Phase 4: ML Enhancements (Week 4+)
1. Historical trend analysis
2. Pricing optimization model
3. Success rate tracking
4. Feedback loop for Claude

---

## Support

**Documentation:**
- `/src/lib/intelligence/dm-strategy/README.md` - Detailed technical docs
- `/DM_STRATEGY_ENGINE.md` - This file (executive overview)

**Test Script:**
- `/scripts/test-dm-strategy.ts` - Comprehensive test suite

**Key Files:**
- Core engine: `/src/lib/intelligence/dm-strategy/`
- API routes: `/src/app/api/dm-strategy/`
- Claude prompts: `/src/lib/intelligence/claude/prompts/dm-strategy.ts`

**Database:**
- Schema: `/prisma/schema.prisma`
- Migration: `/prisma/migrations/20260212173036_add_dm_strategy_engine/`

---

## Success Metrics

**Primary KPIs:**
1. **DM% Improvement:** Target +3-5pp across portfolio
2. **ARR Protected:** $1M+ in prevented churn
3. **ARR Expansion:** $2M+ in upsell/growth
4. **Recommendation Acceptance Rate:** 60%+ of critical/high priority

**Secondary KPIs:**
1. Recommendation quality (manual review score)
2. Time to recommendation (seconds, not hours)
3. Impact prediction accuracy (actual vs projected)
4. User engagement (recommendations reviewed/accepted)

---

**Built with:** TypeScript, Zod, Claude Sonnet 4.5, Prisma, SQLite
**License:** Proprietary - Skyvera Internal
**Version:** 1.0.0
**Last Updated:** 2026-02-12
