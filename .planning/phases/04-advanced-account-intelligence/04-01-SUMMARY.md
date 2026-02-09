---
phase: 04-advanced-account-intelligence
plan: 01
status: complete
subsystem: data-layer
tags: [account-plans, zod, data-access, mock-data, stakeholders, strategy]

dependencies:
  requires:
    - 01-01-foundation-types
    - 01-02-semantic-layer
  provides:
    - account-plan-types
    - account-plan-data-access
    - hero-account-mock-data
  affects:
    - 04-02-stakeholder-ui
    - 04-03-strategy-ui
    - 04-04-intelligence-ui

tech:
  stack:
    added: []
    patterns:
      - graceful-degradation-data-access
      - fuzzy-file-matching
      - result-type-error-handling
      - parallel-data-aggregation

files:
  created:
    - src/lib/types/account-plan.ts
    - src/lib/data/server/account-plan-data.ts
    - data/account-plans/stakeholders/*.json (5 files)
    - data/account-plans/strategy/*.json (5 files)
    - data/account-plans/actions/*.json (5 files)
    - data/account-plans/competitors/*.json (5 files)
  modified:
    - src/lib/types/index.ts

decisions:
  - title: Graceful degradation for missing data
    rationale: Account plan data may not exist for all 140 customers - return empty arrays instead of errors
    alternatives: [throw errors, return null, show error UI]
    chosen: empty arrays
    impact: UI components can safely render without data checks

  - title: Fuzzy matching for intelligence reports
    rationale: Report filenames use underscores and abbreviations (British_Telecommunications.md vs british-telecommunications-plc)
    alternatives: [exact match only, manual mapping file, fuzzy pattern matching]
    chosen: fuzzy pattern matching with multiple strategies
    impact: Flexible file lookup that handles naming inconsistencies

  - title: Parallel data aggregation in getAccountPlanData
    rationale: Six data sources can be fetched independently for better performance
    alternatives: [sequential fetching, separate API calls]
    chosen: Promise.all parallel execution
    impact: Faster data loading for account plan pages

metrics:
  duration: 6min
  completed: 2026-02-09
---

# Phase 04 Plan 01: Account Plan Data Layer Summary

**One-liner:** Complete account plan type system with Zod schemas for stakeholders, strategy, actions, competitors, intelligence, and news - plus data access layer with 20 mock JSON files for 5 hero accounts across 3 BUs

## What Was Built

### 1. Account Plan Zod Schemas (src/lib/types/account-plan.ts)

**Type System:**
- **StakeholderSchema**: Org hierarchy with id, name, title, role (decision-maker/influencer/champion/user/blocker), RACI roles, reportsTo for tree building, relationship strength, contact info, tenure, interests, last interaction
- **PainPointSchema**: Business challenges with status (active/monitoring/resolved), severity (high/medium/low), identified date, owner
- **OpportunitySchema**: Revenue opportunities with status (identified/exploring/proposed/won/lost), estimated value, probability 0-100, identified date, owner
- **StrategyDataSchema**: Combined pain points + opportunities for strategy tab
- **ActionItemSchema**: Task tracking with status (todo/in-progress/done), priority (high/medium/low), owner, due date, created date
- **CompetitorSchema**: Competitive analysis with type (our-competitor/customer-competitor/both), strengths array, weaknesses array, description
- **IntelligenceReportSchema**: Structured data from markdown reports with opportunities, risks, recommendations arrays

**38 exported schemas and types** following existing Zod 4 patterns from customer.ts/financial.ts

### 2. Data Access Layer (src/lib/data/server/account-plan-data.ts)

**Functions:**
- `slugifyCustomerName()`: Converts customer names to file-safe slugs (spaces to hyphens, remove special chars, & to and)
- `findIntelligenceFile()`: Fuzzy matcher for intelligence report markdown files (handles underscore variations and abbreviations)
- `getStakeholders()`: Loads org hierarchy from JSON with Zod validation
- `getStrategyData()`: Loads pain points and opportunities
- `getActionItems()`: Loads action items with status tracking
- `getCompetitors()`: Loads competitive analysis
- `getIntelligenceReport()`: Finds and loads markdown reports with fuzzy matching, returns raw markdown
- `getCustomerNews()`: Loads news articles, maps field names (published→publishedAt, relevance_score→relevanceScore)
- `getAccountPlanData()`: Aggregates all data in parallel with Promise.all

**Graceful degradation:** Missing files return empty arrays/objects, not errors - enables safe UI rendering for accounts without mock data

### 3. Mock Data for 5 Hero Accounts

**British Telecommunications plc** (CloudSense, #7 customer):
- 4 stakeholders: Allison Kirkby (CEO), Hena Jalil (CIO Business, champion), Jon James (CEO Business, new exec), Tom Meakin (Strategy)
- 3 pain points: Budget pressure (GBP 3B savings initiative), B2B revenue decline, system complexity (2,400→500 systems)
- 3 opportunities: B2B turnaround expansion ($400K), enterprise quote complexity ($200K), partner channel ($150K)
- 5 action items: Executive briefing, Jon James introduction, expansion proposal, QBR, ROI case study (done)
- 3 competitors: Salesforce Revenue Cloud, Oracle CPQ (our competitors), VodafoneThree (customer competitor)

**Liquid Telecom** (CloudSense):
- 3 stakeholders: Nic Rudnick (CEO), Ben Roberts (CTO, champion), Reshaad Sha (CCO)
- 2 pain points: Multi-country ops complexity (13 African markets), manual quote processes
- 2 opportunities: Enterprise fiber CPQ ($250K), data center services ($180K)
- 4 actions: Ben Roberts meeting, fiber proposal, health check (done), data center demo
- 2 competitors: Amdocs (our competitor), MTN Group (customer competitor)

**Telefonica UK Limited** (CloudSense):
- 3 stakeholders: Patricia Cobian (CCO), Derek McManus (COO, champion), Nina Bibby (CMO)
- 2 pain points: SME acquisition costs rising, complex product bundling
- 2 opportunities: IoT solutions CPQ ($300K), self-service SME portal ($120K)
- 4 actions: IoT demo, QBR with Derek, IoT business case, contract renewal (done)
- 2 competitors: Salesforce Revenue Cloud (our competitor), EE/BT (customer competitor)

**Spotify** (CloudSense):
- 4 stakeholders: Daniel Ek (CEO), Paul Vogel (CFO), Gustav Soderstrom (CPO/CTO, champion), Alex Norström (CBO)
- 2 pain points: Complex partner contracts, ad sales quote turnaround
- 3 opportunities: Advanced CLM ($350K), advertising CPQ ($200K), creator economy tooling ($150K)
- 5 actions: CLM proposal to Gustav, advertising ROI, CFO QBR, security audit (done), creator discovery
- 3 competitors: Conga (our competitor), Apple Music, YouTube Music (customer competitors)

**AT&T Services Inc** (Kandy):
- 4 stakeholders: John Stankey (CEO), Pascal Desroches (CFO), Anne Chow (CEO Business, champion), Jeremy Legg (CTO)
- 3 pain points: Legacy BSS limiting agility, 5G enterprise bundle complexity, FirstNet quote requirements
- 3 opportunities: 5G enterprise CPQ ($500K, 70%), FirstNet module ($300K, 55%), BSS integration ($250K, 60%)
- 6 actions: 5G roadmap to Anne, FirstNet workshop, integration health check, renewal proposal, QBR (done), security audit (done)
- 3 competitors: Amdocs, Oracle CPQ (our competitors), Verizon (customer competitor)

**Total mock data:**
- 18 stakeholders across 5 accounts with realistic org hierarchies
- 12 pain points with severity/status
- 13 opportunities with estimated values ($50K-$500K range) and probabilities
- 24 action items across todo/in-progress/done statuses
- 13 competitors (7 our-competitors, 6 customer-competitors)
- 20 JSON files validated and TypeScript-typed

## Technical Implementation

**Pattern: Graceful Degradation**
```typescript
// Missing files return empty arrays, not errors
if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
  return ok([]) // Not an error - just no data yet
}
```

**Pattern: Fuzzy Intelligence Matching**
```typescript
// Try multiple filename patterns
const patterns = [
  customerName.replace(/\s+/g, '_'), // British_Telecommunications
  customerName.replace(/\s+(plc|inc|ltd|limited)$/i, '').replace(/\s+/g, '_'), // British_Telecommunications (no plc)
  slugifyCustomerName(customerName).replace(/-/g, '_') // british_telecommunications
]

// Fuzzy word matching for edge cases
const nameWords = customerName.toLowerCase().split(/\s+/).filter(w => w.length > 2)
const matchCount = nameWords.filter(word => fileLower.includes(word)).length
if (matchCount >= Math.min(2, nameWords.length)) return file
```

**Pattern: Parallel Data Aggregation**
```typescript
// Fetch all data sources in parallel for performance
const [stakeholders, strategy, actions, competitors, intelligence, news] =
  await Promise.all([
    getStakeholders(customerName),
    getStrategyData(customerName),
    getActionItems(customerName),
    getCompetitors(customerName),
    getIntelligenceReport(customerName),
    getCustomerNews(customerName),
  ])
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

✓ TypeScript compilation passes with zero errors
✓ All 38 Zod schemas export correctly from @/lib/types
✓ 20 mock JSON files exist across 4 subdirectories in data/account-plans/
✓ All JSON files are valid (node validation check passed)
✓ Data access functions handle missing files gracefully (return empty arrays)
✓ Intelligence report reader verified (26 .md files in data/intelligence/reports/)
✓ News reader verified (multiple .json files in data/news/)

## Next Phase Readiness

**Ready for 04-02 (Stakeholder UI):**
- Stakeholder types defined with org hierarchy support (reportsTo field for tree building)
- RACI roles ready for org chart visualization
- Relationship strength for visual indicators
- Mock data has 3-4 stakeholders per hero account with realistic hierarchies

**Ready for 04-03 (Strategy UI):**
- PainPoint and Opportunity types defined with status, severity, probability
- StrategyData combines both for single data fetch
- Mock data has realistic pain points and opportunities with estimated values
- All opportunities have probability (30-70%) for prioritization

**Ready for 04-04 (Intelligence UI):**
- IntelligenceReport type defined for structured markdown parsing
- getIntelligenceReport() finds files with fuzzy matching (handles naming variations)
- Raw markdown returned for initial UI (structured parsing can be added later)
- 26 existing intelligence reports available for hero accounts

**Blockers:** None

**Concerns:**
- Intelligence report parsing is currently raw markdown - structured extraction (opportunities, risks, recommendations) deferred to 04-04 UI implementation if needed
- News field mapping (published→publishedAt) assumes existing NewsArticle schema - verify compatibility in 04-04

## Performance Notes

**Duration:** 6 minutes (on track with Phase 4 velocity)

**Efficiency gains:**
- Parallel data fetching in getAccountPlanData reduces latency
- Graceful degradation avoids expensive error handling in UI
- Fuzzy matching eliminates need for manual filename mapping file

## Files Changed

**Created (23 files):**
- src/lib/types/account-plan.ts (177 lines, 38 exports)
- src/lib/data/server/account-plan-data.ts (336 lines, 8 functions)
- data/account-plans/stakeholders/*.json (5 files, 18 stakeholders)
- data/account-plans/strategy/*.json (5 files, 12 pain points + 13 opportunities)
- data/account-plans/actions/*.json (5 files, 24 action items)
- data/account-plans/competitors/*.json (5 files, 13 competitors)

**Modified (1 file):**
- src/lib/types/index.ts (added account-plan export)

**Total additions:** 1,530 lines (types + data access + mock data)
