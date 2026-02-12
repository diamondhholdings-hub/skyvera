# DM% Strategy Engine - System Architecture

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER / SYSTEM                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER (6 Routes)                         │
├─────────────────────────────────────────────────────────────────────┤
│  POST /analyze              │  GET  /recommendations                 │
│  POST /analyze-account      │  POST /accept-recommendation           │
│  POST /defer-recommendation │  GET  /impact-calculator               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DM STRATEGY ENGINE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │  ANALYZER    │──────▶│ RECOMMENDER  │──────▶│ PRIORITIZER  │      │
│  │              │      │              │      │              │      │
│  │ - Analyze    │      │ - Generate   │      │ - Calculate  │      │
│  │   Account    │      │   Recs via   │      │   Priority   │      │
│  │ - Analyze    │      │   Claude     │      │   Score      │      │
│  │   Portfolio  │      │ - Parse JSON │      │ - Rank Recs  │      │
│  │ - Identify   │      │ - Validate   │      │ - Group by   │      │
│  │   Risks      │      │   Schema     │      │   Level      │      │
│  └──────┬───────┘      └──────┬───────┘      └──────────────┘      │
│         │                     │                                      │
│         │                     │                                      │
│         │                     ▼                                      │
│         │              ┌──────────────┐                             │
│         │              │  IMPACT      │                             │
│         │              │  CALCULATOR  │                             │
│         │              │              │                             │
│         │              │ - ARR Impact │                             │
│         │              │ - DM Impact  │                             │
│         │              │ - ROI        │                             │
│         │              │ - Projection │                             │
│         │              └──────────────┘                             │
│         │                                                            │
└─────────┼────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────┐    ┌──────────────────┐    ┌────────────────┐  │
│  │   CUSTOMER     │    │  CLAUDE API      │    │  DATABASE      │  │
│  │   DATABASE     │    │  (via Orch.)     │    │  (Prisma)      │  │
│  │                │    │                  │    │                │  │
│  │ - ARR          │    │ - Sonnet 4.5     │    │ - DMRecom.     │  │
│  │ - Health       │    │ - Rate Limit     │    │ - DMAnalysis   │  │
│  │ - Subscriptions│    │ - Cache          │    │   Run          │  │
│  │ - Renewals     │    │ - Priority Queue │    │                │  │
│  └────────────────┘    └──────────────────┘    └────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
USER REQUEST
    │
    ▼
┌───────────────────────────────────────────────────────────────────┐
│ POST /api/dm-strategy/analyze?bu=Cloudsense                       │
└───────────────────┬───────────────────────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  ANALYZER     │
            │               │
            │ 1. Fetch all  │
            │    accounts   │──────┐
            │    from DB    │      │
            └───────┬───────┘      │
                    │              │
                    │              ▼
                    │        ┌─────────────┐
                    │        │  PRISMA     │
                    │        │             │
                    │        │ Customer    │
                    │        │ Subscription│
                    │        └─────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  For Each     │
            │  Account:     │
            │               │
            │ 2. Calculate  │
            │    DM%        │
            │ 3. Assess     │
            │    Risks      │
            │ 4. Assess     │
            │    Opportunities
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ RECOMMENDER   │
            │               │
            │ 5. Build      │
            │    prompt     │──────┐
            │    with       │      │
            │    context    │      │
            └───────┬───────┘      │
                    │              │
                    │              ▼
                    │        ┌─────────────┐
                    │        │  CLAUDE     │
                    │        │  API        │
                    │        │             │
                    │        │ Generate    │
                    │        │ 3-5 recs    │
                    │        └──────┬──────┘
                    │               │
                    │               │ JSON Response
                    │               │
                    │        ┌──────▼──────┐
                    │        │  Parse &    │
                    │        │  Validate   │
                    │        │  with Zod   │
                    │        └──────┬──────┘
                    │               │
                    │◀──────────────┘
                    │
                    ▼
            ┌───────────────┐
            │ PRIORITIZER   │
            │               │
            │ 6. Calculate  │
            │    priority   │
            │    scores     │
            │ 7. Assign     │
            │    levels     │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ ANALYZER      │
            │               │
            │ 8. Aggregate  │
            │    portfolio  │
            │    metrics    │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  SAVE TO DB   │
            │               │
            │ - DMRec       │──────┐
            │ - DMAnalysis  │      │
            │   Run         │      │
            └───────┬───────┘      │
                    │              │
                    │              ▼
                    │        ┌─────────────┐
                    │        │  PRISMA     │
                    │        │             │
                    │        │ Create      │
                    │        │ records     │
                    │        └─────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  RETURN       │
            │  RESPONSE     │
            │               │
            │ - Run ID      │
            │ - Summary     │
            │ - Metrics     │
            └───────────────┘
```

## Data Flow: Single Account Analysis

```
┌──────────────────┐
│ Account Name     │
│ "Telstra Corp"   │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. FETCH ACCOUNT DATA               │
├─────────────────────────────────────┤
│ - Customer record                   │
│ - Subscriptions (ARR, renewals)     │
│ - Health score                      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 2. CALCULATE METRICS                │
├─────────────────────────────────────┤
│ Current ARR:  $850,000              │
│ Projected ARR: $817,000             │
│ Current DM%:  96.2%                 │
│ Target DM%:   90%                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 3. ASSESS RISK                      │
├─────────────────────────────────────┤
│ At Risk? NO                         │
│ Risk Factors: []                    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 4. ASSESS OPPORTUNITY               │
├─────────────────────────────────────┤
│ Growth Potential? YES               │
│ - Strong health score (green)       │
│ - High retention (96.2%)            │
│ - High-value account ($850K)        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 5. BUILD CLAUDE PROMPT              │
├─────────────────────────────────────┤
│ Account: Telstra Corporation        │
│ BU: Cloudsense                      │
│ ARR: $850,000                       │
│ DM%: 96.2%                          │
│ Health: Green                       │
│ Growth Opportunity: YES             │
│                                     │
│ Task: Generate 3-5 recommendations  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 6. CLAUDE API CALL                  │
├─────────────────────────────────────┤
│ Model: Sonnet 4.5                   │
│ Temperature: 0.8 (creative)         │
│ Max Tokens: 4096                    │
│ Priority: MEDIUM                    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 7. PARSE RESPONSE                   │
├─────────────────────────────────────┤
│ Extract JSON                        │
│ Validate with Zod                   │
│ Convert to DMRecommendation[]       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 8. PRIORITIZE                       │
├─────────────────────────────────────┤
│ Calculate priority scores           │
│ Assign levels (critical/high/...)   │
│ Sort by score                       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 9. RETURN ANALYSIS                  │
├─────────────────────────────────────┤
│ Account: Telstra Corporation        │
│ Current DM%: 96.2%                  │
│ At Risk: NO                         │
│ Growth Opportunity: YES             │
│ Recommendations: 4                  │
│   - [HIGH] Increase pricing 15%     │
│   - [MEDIUM] Upsell premium tier    │
│   - [MEDIUM] 3-year contract        │
│   - [LOW] Executive engagement      │
│ Projected ARR Impact: $127,500      │
└─────────────────────────────────────┘
```

## Recommendation Priority Calculation

```
┌─────────────────────────────────────┐
│ RECOMMENDATION                      │
├─────────────────────────────────────┤
│ Title: "Increase pricing 15%"       │
│ ARR Impact: $120,000                │
│ Confidence: 87%                     │
│ Timeline: immediate                 │
│ Risk: low                           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ CALCULATE COMPONENT SCORES          │
├─────────────────────────────────────┤
│ 1. ARR Impact Score                 │
│    = min(100, ($120K/$500K)*100)    │
│    = 24                             │
│                                     │
│ 2. Confidence Score                 │
│    = 87 (already 0-100)             │
│                                     │
│ 3. Urgency Score                    │
│    = 100 (immediate)                │
│                                     │
│ 4. Ease Score                       │
│    = (100 + 100) / 2                │
│    = 100 (low risk + immediate)     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ WEIGHTED SCORE                      │
├─────────────────────────────────────┤
│ Score = (24 × 0.4) +                │
│         (87 × 0.3) +                │
│         (100 × 0.2) +               │
│         (100 × 0.1)                 │
│       = 9.6 + 26.1 + 20 + 10        │
│       = 65.7                        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ ASSIGN PRIORITY LEVEL               │
├─────────────────────────────────────┤
│ Score: 65.7                         │
│ Level: HIGH (60-80)                 │
└─────────────────────────────────────┘
```

## Database Schema Relationships

```
┌─────────────────────────────────────┐
│ Customer                            │
├─────────────────────────────────────┤
│ id                                  │
│ customerName                        │
│ bu                                  │
│ rr, nrr, totalRevenue               │
│ healthScore                         │
└────────┬────────────────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────────────────────┐
│ Subscription                        │
├─────────────────────────────────────┤
│ id                                  │
│ customerId (FK)                     │
│ arr                                 │
│ renewalQtr                          │
│ willRenew                           │
│ projectedArr                        │
└─────────────────────────────────────┘

         (Analysis generates)
                  │
                  ▼
┌─────────────────────────────────────┐
│ DMRecommendation                    │
├─────────────────────────────────────┤
│ id                                  │
│ recommendationId                    │
│ accountName (soft FK)               │
│ bu                                  │
│ type, priority, status              │
│ title, description, reasoning       │
│ arrImpact, dmImpact, marginImpact   │
│ confidenceLevel                     │
│ timeline, ownerTeam, risk           │
│ linkedActionItemId (FK - future)    │
│ createdAt, acceptedAt, completedAt  │
└─────────────────────────────────────┘

         (Tracked by)
                  │
                  ▼
┌─────────────────────────────────────┐
│ DMAnalysisRun                       │
├─────────────────────────────────────┤
│ id                                  │
│ runId                               │
│ runDate                             │
│ accountsAnalyzed                    │
│ recommendationsGenerated            │
│ totalPotentialARR                   │
│ totalPotentialDM                    │
│ status, error                       │
│ bu                                  │
└─────────────────────────────────────┘
```

## API Endpoint Flow

```
┌──────────────────────────────────────────────────────────────┐
│ GET /api/dm-strategy/recommendations?priority=critical      │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. Parse Query Parameters                                    │
│    - priority: "critical"                                    │
│    - status: "pending" (default)                             │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Build Prisma Query                                        │
│    prisma.dMRecommendation.findMany({                        │
│      where: { priority: "critical", status: "pending" },     │
│      orderBy: [{ priority: "asc" }, { arrImpact: "desc" }]   │
│    })                                                         │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Calculate Summary Stats                                   │
│    - Total recommendations: 8                                │
│    - By priority: { critical: 8, high: 0, ... }              │
│    - By type: { churn_prevention: 3, pricing: 2, ... }       │
│    - Total ARR impact: $2,450,000                            │
│    - Avg confidence: 89%                                     │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Return JSON Response                                      │
│    {                                                          │
│      "success": true,                                         │
│      "recommendations": [...],                                │
│      "summary": {...}                                         │
│    }                                                          │
└──────────────────────────────────────────────────────────────┘
```

## Success Workflow: Accept Recommendation → Action Item

```
┌──────────────────────────────────────┐
│ POST /accept-recommendation          │
│ {                                    │
│   recommendationId: "rec-abc123",    │
│   createActionItem: true             │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 1. Fetch Recommendation              │
│    Status: pending                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 2. Update Status                     │
│    status: "accepted"                │
│    acceptedAt: NOW                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 3. Create Action Item (future)       │
│    - Title from recommendation       │
│    - Owner from recommendation       │
│    - Link back to rec ID             │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 4. Link Action Item                  │
│    linkedActionItemId: "action-123"  │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 5. Return Success                    │
│    - Updated recommendation          │
│    - Action item ID                  │
│    - Success message                 │
└──────────────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────┐
│ Any Component (Analyzer, etc.)       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Try Operation                        │
└────┬────┬────────────────────────────┘
     │    │
SUCCESS │  FAILURE
     │    │
     ▼    ▼
┌─────┐ ┌──────────────────────────────┐
│ ok()│ │ catch Error                  │
└─────┘ │ - Log error                  │
        │ - Return err(error)          │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────┐
        │ API Route                    │
        │ - Check result.success       │
        │ - Return 500 if failure      │
        │ - Include error message      │
        └──────────────────────────────┘
```

## Claude Integration Flow

```
┌──────────────────────────────────────┐
│ Recommender                          │
│ generateRecommendations()            │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 1. Build Prompt                      │
│    - Account context                 │
│    - Risk factors                    │
│    - Opportunities                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 2. Claude Orchestrator               │
│    processRequest({                  │
│      prompt,                          │
│      systemPrompt,                    │
│      priority: "MEDIUM",              │
│      temperature: 0.8,                │
│      maxTokens: 4096                  │
│    })                                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 3. Check Cache                       │
│    - Cache key: prompt hash          │
│    - TTL: 1 hour                     │
└────┬────┬────────────────────────────┘
     │    │
   HIT  MISS
     │    │
     ▼    ▼
┌─────┐ ┌──────────────────────────────┐
│Return│ 4. Rate Limiter              │
│Cache │    - Wait for slot           │
└─────┘ │    - 50 req/min              │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────┐
        │ 5. Claude API Call           │
        │    - Model: Sonnet 4.5       │
        │    - Retry on 429 (3x)       │
        │    - Exponential backoff     │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────┐
        │ 6. Parse Response            │
        │    - Extract JSON            │
        │    - Validate with Zod       │
        │    - Handle parse errors     │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────┐
        │ 7. Cache Response            │
        │    - Store for 1 hour        │
        └────────┬─────────────────────┘
                 │
                 ▼
        ┌──────────────────────────────┐
        │ 8. Return Result             │
        │    ok(ClaudeResponse)         │
        └──────────────────────────────┘
```

---

**Legend:**
- `┌─────┐` = Component/Module
- `─────▶` = Data flow
- `1:N` = One-to-many relationship
- `FK` = Foreign key
- `(soft FK)` = Logical relationship (not enforced)
- `✅` = Complete/Applied

