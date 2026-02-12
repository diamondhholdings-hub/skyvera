# DM Recommendations Pipeline

Comprehensive system to extract revenue data, analyze opportunities, and generate AI-powered retention recommendations.

## Overview

This pipeline:
1. **Extracts** enhanced DM (Decline/Maintenance) data from Excel with pricing history, renewal dates, and contract details
2. **Analyzes** 87 customer accounts to detect 4 types of opportunities (pricing, churn risk, upsell, contract optimization)
3. **Generates** AI-powered, account-specific recommendations using Claude API
4. **Seeds** recommendations into the database for display in the UI

## Pipeline Steps

### 1. Enhanced Data Extraction (`extract-dm-enhanced-data.py`)

Extracts comprehensive data from the Excel budget file:
- Current and prior year ARR
- DM% (retention rate) calculation
- Renewal dates and contract types
- Product lists by account
- Health scores (0-100)
- Pain points and opportunities from account plans

**Output:** `data/dm-enhanced-data.json` (87 accounts, ~$42M ARR)

### 2. Opportunity Analysis (`analyze-dm-opportunities.ts`)

Detects opportunities across 4 categories:

- **Pricing Opportunities** (38 found)
  - Pricing declined >5% vs prior year
  - Priced 10%+ below peer average
  - Expected impact: $X per account

- **Churn Risk** (5 found)
  - Health score < 70 + renewal < 180 days
  - DM% < 85% (severe revenue decline)
  - Unresolved pain points > 2
  - Expected impact: Prevent $X ARR loss

- **Upsell** (4 found)
  - ARR > $500K + products < 3
  - Health score > 70 + DM% >= 95%
  - Expected impact: Add 20-30% ARR

- **Contract Optimization** (25 found)
  - Annual contracts > $1M → multi-year
  - Expiring contracts → restructure
  - Expected impact: Lock in revenue + increase

**Output:** `data/dm-opportunities.json` (72 opportunities, $14M+ potential impact)

### 3. Recommendation Generation (`generate-recommendations.ts`)

Uses Claude API to generate specific, actionable recommendations:
- Account-specific actions (3-5 steps)
- Timeline and owner team
- Expected ARR and DM% impact
- Risks and success factors
- Confidence level (high/medium/low)

**Rate limiting:** 2 seconds between API calls
**Progress:** Saves every 10 recommendations

**Output:** `data/dm-recommendations.json` + `data/dm-summary.txt`

### 4. Database Seeding (`seed-dm-recommendations.ts`)

Inserts recommendations into Prisma database:
- Maps opportunity types to DB schema
- Converts confidence → priority (critical/high/medium/low)
- Converts timeline (weeks) → category (immediate/short/medium/long-term)
- Skips duplicates
- Shows summary by type and priority

**Output:** Records in `DMRecommendation` table

## Quick Start

### Test Mode (No API calls)

```bash
# Run data extraction and analysis only
./scripts/test-dm-pipeline.sh
```

This generates:
- `data/dm-enhanced-data.json` (87 accounts)
- `data/dm-opportunities.json` (72 opportunities)

### Test Recommendations (Template-based, No API)

```bash
# Generate template recommendations without Claude API
cd scripts
npx ts-node generate-test-recommendations.ts

# Seed to database
npx ts-node seed-dm-recommendations.ts
```

### Full Pipeline (With Claude API)

```bash
# Set API key
export ANTHROPIC_API_KEY=your_key_here

# Run full pipeline
./scripts/run-dm-pipeline.sh

# Or limit recommendations for testing (e.g., 10 recommendations)
./scripts/run-dm-pipeline.sh --limit 10
```

This takes ~5-10 minutes depending on the number of recommendations (2 sec delay per API call).

## Files Generated

```
data/
  dm-enhanced-data.json         # Enhanced customer data (87 accounts)
  dm-opportunities.json         # Detected opportunities (72 opps)
  dm-recommendations.json       # AI-generated recommendations (37 high/medium)
  dm-recommendations-progress.json  # Progress checkpoint (saved every 10)
  dm-summary.txt                # Executive summary report
  dm-data-quality.log           # Missing data issues (if any)
```

## Scripts

```
scripts/
  # Pipeline scripts
  run-dm-pipeline.sh                  # Master pipeline (all steps)
  test-dm-pipeline.sh                 # Test mode (no API)

  # Individual scripts
  extract-dm-enhanced-data.py         # Python: Excel extraction
  analyze-dm-opportunities.ts         # TypeScript: Opportunity detection
  generate-recommendations.ts         # TypeScript: Claude API generation
  generate-test-recommendations.ts    # TypeScript: Template recommendations (no API)
  seed-dm-recommendations.ts          # TypeScript: Database seeding

  # Config
  tsconfig.json                       # TypeScript config for scripts (CommonJS)
  DM_PIPELINE_README.md              # This file
```

## Database Schema

```prisma
model DMRecommendation {
  id                  Int      @id @default(autoincrement())
  recommendationId    String   @unique @default(cuid())

  // Account
  accountName         String
  bu                  String   // CloudSense/Kandy/STL

  // Recommendation
  type                String   // pricing/churn_prevention/upsell/contract_restructure
  priority            String   // critical/high/medium/low
  title               String
  description         String   // Includes specific actions and success factors
  reasoning           String

  // Impact
  arrImpact           Float    // Expected ARR impact ($)
  dmImpact            Float    // Expected DM% improvement
  confidenceLevel     Int      // 0-100

  // Execution
  timeline            String   // immediate/short-term/medium-term/long-term
  ownerTeam           String   // Account Management/Customer Success/Sales
  risk                String   // high/medium/low

  // Status
  status              String   @default("pending")

  @@index([accountName])
  @@index([status])
  @@index([priority])
}
```

## Results Summary

### Test Run Statistics

**Data Extraction:**
- 87 accounts with subscription data
- $41.6M current ARR
- $43.6M prior ARR
- 95.3% overall DM%

**Opportunity Analysis:**
- 72 opportunities detected
- $14.0M potential ARR impact
- By type:
  - Pricing: 38 (54%)
  - Contract Optimization: 25 (35%)
  - Churn Risk: 5 (7%)
  - Upsell: 4 (6%)
- By severity:
  - High: 8
  - Medium: 29
  - Low: 35

**Recommendations (High/Medium only):**
- 37 actionable recommendations
- $13.6M potential ARR impact
- 35 unique accounts covered
- Priority distribution:
  - Critical: 8
  - High: 18
  - Medium: 11

## Example Recommendation

```json
{
  "accountName": "British Telecommunications plc",
  "bu": "Cloudsense",
  "type": "contract_restructure",
  "priority": "critical",
  "title": "Contract Optimization - Multi-year",
  "description": "Account on Enterprise Annual contract with ARR $6,317,570. Strong candidate for multi-year agreement to lock in revenue.\n\nSpecific Actions:\n1. Review current contract terms and renewal timeline\n2. Prepare multi-year proposal with strategic pricing\n3. Schedule renewal discussion 90 days before expiration\n4. Negotiate mutually beneficial terms with legal review\n\nSuccess Factors:\n1. Long-term partnership mindset from customer\n2. Competitive differentiation and switching costs\n3. Flexible terms that align with customer needs",
  "reasoning": "Current contract type (Enterprise Annual) with ARR $6,317,570 and strong health score suggests multi-year stability.",
  "arrImpact": 14467027.5,
  "dmImpact": 0,
  "confidenceLevel": 85,
  "timeline": "medium-term",
  "ownerTeam": "Account Management",
  "risk": "low",
  "status": "pending"
}
```

## Data Quality

**Complete Data:**
- All 87 accounts have ARR and DM% data
- Renewal dates calculated from quarters
- Health scores computed from multiple factors
- Products inferred from BU and ARR size

**Estimated Data:**
- Prior year ARR (estimated from BU-level DM% with variance)
- Renewal dates (mapped from quarters to days)
- Health scores (calculated from DM%, subscription count, renewal proximity)
- Product lists (generated based on ARR and BU)

**No Missing Data Issues:** 0 accounts flagged with missing critical data

## Troubleshooting

### Python Issues

```bash
# Install openpyxl if missing
pip3 install openpyxl

# Check Python version (requires 3.7+)
python3 --version
```

### TypeScript/Node Issues

```bash
# Install dependencies
npm install

# Check that dotenv is installed
npm list dotenv

# Verify database connection
cat .env.local | grep DATABASE_URL
```

### Database Issues

```bash
# Generate Prisma client
npx prisma generate

# Check database
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### API Issues

```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Test with limited recommendations
./scripts/run-dm-pipeline.sh --limit 5
```

## Next Steps

1. **Review Recommendations**
   ```bash
   cat data/dm-summary.txt
   ```

2. **View in Database**
   ```bash
   npx prisma studio
   ```

3. **Check UI**
   - Navigate to account pages
   - View "Retention" tab
   - See recommendations with priorities

4. **Iterate**
   - Adjust opportunity detection logic in `analyze-dm-opportunities.ts`
   - Modify AI prompts in `generate-recommendations.ts`
   - Re-run pipeline

## Cost Estimation

**Claude API Usage:**
- ~2,000 tokens per recommendation
- 37 recommendations = ~74,000 tokens
- Cost: ~$0.30 (input) + ~$0.75 (output) = **~$1.05 total**

**Time:**
- Data extraction: 5 seconds
- Opportunity analysis: 3 seconds
- Recommendation generation: 2 minutes (37 recs × 2 sec delay + API time)
- Database seeding: 2 seconds
- **Total: ~3 minutes**

## Maintenance

**Re-run when:**
- Excel budget file is updated
- Account data changes significantly
- New opportunities need to be detected
- Recommendations need refreshing

**Frequency:** Monthly or after major business changes

---

**Questions?** Contact the development team or check the code comments in individual scripts.
