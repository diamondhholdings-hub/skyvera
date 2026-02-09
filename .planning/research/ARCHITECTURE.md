# Architecture Research

**Domain:** AI-Powered Business Intelligence Platform
**Researched:** 2026-02-08
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER (UI)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Dashboard  │  │   Account   │  │  Scenario   │  │  Natural    │   │
│  │    Views    │  │   Plans     │  │  Modeling   │  │  Language   │   │
│  │             │  │   (140)     │  │   Engine    │  │   Query     │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │           │
├─────────┴────────────────┴────────────────┴────────────────┴───────────┤
│                    INTELLIGENCE ORCHESTRATION LAYER                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Claude AI Integration                           │  │
│  │  - Real-time analysis & insights                                  │  │
│  │  - Natural language understanding                                 │  │
│  │  - Account intelligence generation                                │  │
│  │  - Scenario impact analysis                                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                    DATA INTEGRATION & SEMANTIC LAYER                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Data      │  │  Semantic  │  │  Real-Time │  │   Cache    │       │
│  │  Adapter   │  │   Model    │  │  Aggregator│  │   Layer    │       │
│  │  Registry  │  │  (Business │  │  (News,    │  │  (15-min   │       │
│  │            │  │  Metrics)  │  │  Market)   │  │  refresh)  │       │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘       │
│        │               │               │               │               │
├────────┴───────────────┴───────────────┴───────────────┴───────────────┤
│                        DATA SOURCES LAYER                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │Salesforce│  │ Financial│  │  Notion  │  │  Excel   │  │External │  │
│  │   CRM    │  │  System  │  │ Database │  │  Budget  │  │  APIs   │  │
│  │          │  │   (GL)   │  │          │  │  Files   │  │ (News)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Dashboard Views | KPI visualization, BU performance, cost breakdowns | React/Vue components with Chart.js/D3 |
| Account Plans | 140 customer plan management, health tracking, org charts | Structured forms + Claude-generated intelligence |
| Scenario Modeling | Financial/HC/Customer/Strategic what-if analysis | Input forms + calculation engine + Claude impact analysis |
| Natural Language Query | Text-based data exploration and insights | Chat interface → Claude API → data retrieval |
| Intelligence Orchestration | Claude AI request routing, prompt engineering, response formatting | API gateway with queue management for rate limits |
| Data Adapter Registry | Connector management for all data sources | Plugin architecture with standardized interfaces |
| Semantic Model | Business metric definitions, unified schema | Graph-based metadata layer (GraphRAG pattern) |
| Real-Time Aggregator | External intelligence gathering (news, market data) | Event-driven polling with caching |
| Cache Layer | Performance optimization for repeated queries | Redis/in-memory with TTL management |

## Recommended Architecture for Skyvera

### Layered Architecture with AI-Native Intelligence

**Core Philosophy:**
The architecture follows the 2026 AI-native pattern where an intelligence layer sits on top of deterministic data operations, making the system context-aware and insight-driven. This is not retrofitted AI—it's designed intelligence-first.

**Key Architectural Decisions:**

1. **Intelligence-First Design** - Claude AI is the orchestration center, not an add-on
2. **Semantic Layer Centralization** - All data sources feed a unified business metric model
3. **Demo-Optimized** - 24-hour timeline drives "good enough" over perfect
4. **Modular Components** - Each capability can be built in parallel
5. **Cache-Heavy** - Speed prioritized with 15-minute refresh acceptable

### Three-Tier Intelligence Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TIER 1: EXPERIENCE                      │
│   Four parallel UI modules (can be built simultaneously)     │
│   - Dashboard (existing + enhanced)                          │
│   - Account Plans (new 7-tab interface)                      │
│   - Scenario Modeler (new what-if engine)                    │
│   - NL Query Interface (new chat UI)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                      TIER 2: INTELLIGENCE                    │
│   Single Claude orchestration service                        │
│   - Prompt routing based on UI context                       │
│   - Response enrichment from semantic model                  │
│   - Real-time + historical data synthesis                    │
│   - Queue-based rate limit management                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                      TIER 3: DATA FOUNDATION                 │
│   Five adapter modules (parallel development)                │
│   - Excel Budget Parser (reuse existing code)                │
│   - Salesforce Connector (API-led integration)               │
│   - Financial System (GL data pull)                          │
│   - Notion Database (GraphQL/REST)                           │
│   - External Intelligence (news APIs)                        │
│   → Unified semantic model (shared business metrics)         │
└─────────────────────────────────────────────────────────────┘
```

## Recommended Project Structure

```
skyvera-intelligence-platform/
├── src/
│   ├── ui/                          # Presentation tier
│   │   ├── dashboard/               # Enhanced financial dashboard
│   │   │   ├── components/          # Chart components, KPI cards
│   │   │   └── views/               # Dashboard layouts
│   │   ├── account-plans/           # Account planning interface
│   │   │   ├── components/          # 7-tab system, org charts
│   │   │   └── intelligence/        # Claude-generated sections
│   │   ├── scenario-modeler/        # What-if analysis UI
│   │   │   ├── financial/           # Pricing, cost, margin scenarios
│   │   │   ├── headcount/           # HC planning scenarios
│   │   │   ├── customer/            # Churn, acquisition scenarios
│   │   │   └── strategic/           # M&A, divestiture scenarios
│   │   └── nl-query/                # Natural language interface
│   │       ├── chat/                # Chat UI components
│   │       └── visualizations/      # Dynamic result rendering
│   ├── intelligence/                # Intelligence tier
│   │   ├── claude/                  # Claude API integration
│   │   │   ├── orchestrator.ts      # Request routing and queueing
│   │   │   ├── prompts/             # Prompt templates by use case
│   │   │   ├── enrichment.ts        # Response enhancement logic
│   │   │   └── rate-limiter.ts      # Queue-based rate limit mgmt
│   │   ├── semantic/                # Semantic layer
│   │   │   ├── schema/              # Business metric definitions
│   │   │   ├── graph/               # GraphRAG knowledge model
│   │   │   └── resolver.ts          # Metric calculation engine
│   │   └── cache/                   # Caching strategy
│   │       ├── redis-client.ts      # Cache implementation
│   │       └── invalidation.ts      # TTL and refresh logic
│   ├── data/                        # Data foundation tier
│   │   ├── adapters/                # Data source connectors
│   │   │   ├── excel/               # Excel budget parser
│   │   │   │   ├── parser.ts        # REUSE existing openpyxl logic
│   │   │   │   └── mappings.ts      # Sheet-to-semantic mappings
│   │   │   ├── salesforce/          # Salesforce CRM adapter
│   │   │   │   ├── client.ts        # Salesforce API client
│   │   │   │   └── transforms.ts    # CRM data normalization
│   │   │   ├── financial/           # GL system connector
│   │   │   │   └── gl-adapter.ts    # Financial data pull
│   │   │   ├── notion/              # Notion database adapter
│   │   │   │   └── notion-client.ts # Notion API integration
│   │   │   └── external/            # External intelligence
│   │   │       ├── news-api.ts      # News aggregation
│   │   │       └── market-data.ts   # Market intelligence
│   │   ├── models/                  # Unified data models
│   │   │   ├── account.ts           # Customer account model
│   │   │   ├── financial.ts         # Financial metrics model
│   │   │   └── scenario.ts          # Scenario definition model
│   │   └── registry/                # Adapter registry
│   │       └── connector-factory.ts # Dynamic adapter loading
│   ├── scenarios/                   # Scenario modeling engine
│   │   ├── engine/                  # Core calculation engine
│   │   │   ├── calculator.ts        # What-if computation
│   │   │   └── dependency-graph.ts  # Variable dependency tracking
│   │   ├── templates/               # Pre-built scenario templates
│   │   │   ├── financial.ts         # Pricing, margin scenarios
│   │   │   ├── headcount.ts         # HC planning scenarios
│   │   │   ├── customer.ts          # Retention scenarios
│   │   │   └── strategic.ts         # M&A scenarios
│   │   └── impact-analysis/         # Claude-powered impact assessment
│   │       └── analyzer.ts          # AI-driven scenario insights
│   └── shared/                      # Shared utilities
│       ├── types/                   # TypeScript type definitions
│       ├── utils/                   # Helper functions
│       └── config/                  # Environment configuration
├── existing-code/                   # Preserve existing work
│   ├── excel-analysis.py            # REUSE: Budget parsing logic
│   ├── Business_Analysis_Dashboard.html  # REUSE: Chart structure
│   └── financial-models/            # REUSE: ARR, margin calculations
├── data/                            # Data storage
│   ├── cache/                       # Cached intelligence
│   ├── scenarios/                   # Saved scenario models
│   └── accounts/                    # Account plan data
└── docs/                            # Documentation
    ├── architecture/                # Architecture decisions
    ├── api/                         # API documentation
    └── intelligence/                # Prompt engineering docs
```

### Structure Rationale

- **ui/**: Four parallel modules for each major capability—allows simultaneous development by different agents/sessions
- **intelligence/**: Single orchestration point for all Claude interactions—ensures consistent prompt engineering and rate limit management
- **data/adapters/**: Five independent connectors—each can be built in parallel with standardized interfaces
- **scenarios/**: Isolated calculation engine—separates deterministic math from AI-powered insights
- **existing-code/**: Preserves working Excel parsing, dashboard structure, and financial models for reuse

## Architectural Patterns

### Pattern 1: Intelligence Orchestration with Queue-Based Rate Limiting

**What:** All Claude API requests flow through a central orchestration service that manages rate limits via queuing, enriches responses with semantic context, and routes requests based on UI source.

**When to use:** Essential for production systems processing hundreds of Claude API requests per minute. Critical for demo to prevent rate limit failures.

**Trade-offs:**
- Pros: Prevents rate limit errors, enables request prioritization, centralizes prompt engineering
- Cons: Adds latency (queue processing time), single point of failure (mitigate with circuit breaker)

**Example:**
```typescript
// intelligence/claude/orchestrator.ts
class ClaudeOrchestrator {
  private queue: PriorityQueue<ClaudeRequest>;
  private rateLimiter: RateLimiter;
  private semanticModel: SemanticLayer;

  async processRequest(request: ClaudeRequest): Promise<EnrichedResponse> {
    // Add to queue with priority (NL queries = high, background enrichment = low)
    await this.queue.enqueue(request, request.priority);

    // Rate limiter ensures we don't exceed Claude API limits
    await this.rateLimiter.waitForSlot();

    // Enrich prompt with semantic context before sending to Claude
    const enrichedPrompt = await this.semanticModel.enrichPrompt(request.prompt);

    // Send to Claude
    const response = await claude.messages.create({
      model: "claude-opus-4-6",
      messages: [{ role: "user", content: enrichedPrompt }]
    });

    // Enrich response with data references
    return this.semanticModel.enrichResponse(response);
  }
}
```

### Pattern 2: Semantic Layer as Intelligence Gateway

**What:** A unified business metric model sits between raw data sources and the intelligence layer. All data access goes through this semantic layer, which provides consistent definitions (e.g., "ARR" means the same thing whether from Excel, Salesforce, or financial system).

**When to use:** Essential for multi-source data integration. Prevents "data dialect" problems where different sources use different terminology.

**Trade-offs:**
- Pros: Single source of truth, consistent business logic, enables GraphRAG for agent access
- Cons: Upfront modeling effort, potential bottleneck if not cached properly

**Example:**
```typescript
// intelligence/semantic/schema/metrics.ts
class SemanticModel {
  private metricDefinitions: Map<string, MetricDefinition>;
  private dataAdapters: Map<string, DataAdapter>;

  async resolveMetric(metricName: string, context: QueryContext): Promise<MetricValue> {
    const definition = this.metricDefinitions.get(metricName);

    // Example: "ARR" pulls from Excel budget (RR Summary sheet) or Salesforce
    if (metricName === "ARR") {
      const recurringRevenue = await this.dataAdapters.get("excel")
        .query({ sheet: "RR Summary", metric: "Total RR" });
      return recurringRevenue * 4; // ARR = RR × 4 quarters
    }

    // Cache resolved metrics for 15 minutes
    return this.cache.set(metricName, value, { ttl: 900 });
  }

  // GraphRAG: Knowledge graph for Claude agent access
  buildKnowledgeGraph(): Graph {
    // Converts metric definitions into semantic triples
    // Enables Claude to understand: "ARR depends-on RR" relationships
  }
}
```

### Pattern 3: Adapter Registry with Parallel Development

**What:** Each data source (Excel, Salesforce, Financial, Notion, External APIs) has a standardized adapter implementing a common interface. A registry dynamically loads and routes requests to appropriate adapters.

**When to use:** When integrating multiple heterogeneous data sources. Essential for parallel development—each adapter can be built independently.

**Trade-offs:**
- Pros: Clean separation of concerns, parallel development, easy to add new sources
- Cons: Interface abstraction overhead, requires upfront interface design

**Example:**
```typescript
// data/registry/connector-factory.ts
interface DataAdapter {
  connect(): Promise<void>;
  query(query: AdapterQuery): Promise<DataResult>;
  transform(raw: any): UnifiedModel;
}

class ExcelAdapter implements DataAdapter {
  async query(query: AdapterQuery): Promise<DataResult> {
    // REUSE existing Python openpyxl logic
    const workbook = await this.loadWorkbook(BUDGET_FILE);
    const sheet = workbook.sheet(query.sheet);
    return this.extractMetrics(sheet, query.metrics);
  }
}

class SalesforceAdapter implements DataAdapter {
  async query(query: AdapterQuery): Promise<DataResult> {
    // API-led integration with Salesforce REST API
    const response = await this.client.request({
      url: '/services/data/v60.0/query',
      params: { q: this.buildSOQL(query) }
    });
    return this.transform(response.records);
  }
}

class ConnectorFactory {
  private adapters: Map<string, DataAdapter>;

  async getData(source: string, query: AdapterQuery): Promise<UnifiedModel> {
    const adapter = this.adapters.get(source);
    const raw = await adapter.query(query);
    return adapter.transform(raw); // Normalize to unified model
  }
}
```

### Pattern 4: Cache-First with Manual Refresh for Demo

**What:** All data queries check cache first (Redis/in-memory). Cache TTL is 15 minutes for external intelligence, 5 minutes for financial data. Manual refresh button available for demo purposes.

**When to use:** Demo quality acceptable. Prioritizing speed over real-time accuracy.

**Trade-offs:**
- Pros: Dramatically faster response times, reduces API calls (cost savings), acceptable for demo
- Cons: Data staleness (mitigated by short TTL and manual refresh)

**Example:**
```typescript
// intelligence/cache/redis-client.ts
class CacheManager {
  private redis: Redis;

  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    // Check cache first
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    // Cache miss: fetch from source
    const data = await fetcher();
    await this.redis.setex(key, ttl, JSON.stringify(data));
    return data;
  }

  // Manual refresh for demo
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    await this.redis.del(...keys);
  }
}

// Usage in account plans
const accountIntelligence = await cache.get(
  `account:${accountId}:intelligence`,
  () => claude.generateAccountIntel(accountId),
  900 // 15 min TTL
);
```

### Pattern 5: Scenario Dependency Graph for What-If Analysis

**What:** Scenario modeling uses a dependency graph to track relationships between variables (e.g., "Net Margin depends on Revenue and COGS"). When user changes one variable, the graph automatically recalculates dependent metrics.

**When to use:** Essential for multi-variable what-if analysis. Prevents manual recalculation errors.

**Trade-offs:**
- Pros: Automatic propagation of changes, prevents inconsistent states, enables complex scenarios
- Cons: Graph construction complexity, potential circular dependency issues

**Example:**
```typescript
// scenarios/engine/dependency-graph.ts
class ScenarioDependencyGraph {
  private nodes: Map<string, MetricNode>;
  private edges: Map<string, string[]>; // metric -> dependencies

  async calculate(changedMetric: string, newValue: number): Promise<ScenarioResult> {
    // Mark changed metric
    this.nodes.get(changedMetric).value = newValue;

    // Topological sort to determine calculation order
    const calculationOrder = this.topologicalSort(changedMetric);

    // Recalculate dependent metrics
    for (const metricName of calculationOrder) {
      const node = this.nodes.get(metricName);
      node.value = await this.evaluateFormula(node.formula);
    }

    // Claude impact analysis
    const impact = await claude.analyzeScenarioImpact({
      changed: changedMetric,
      cascadeEffects: calculationOrder,
      finalState: this.exportState()
    });

    return { metrics: this.exportState(), insights: impact };
  }

  buildGraph(template: ScenarioTemplate): void {
    // Example: Financial scenario
    // Net Margin = (Revenue - COGS - Expenses) / Revenue
    this.addNode("NetMargin", {
      formula: "(Revenue - COGS - Expenses) / Revenue",
      dependencies: ["Revenue", "COGS", "Expenses"]
    });
  }
}
```

## Data Flow

### Request Flow: Natural Language Query

```
[User types: "What's our EBITDA for Q1'26?"]
    ↓
[NL Query UI] → [Intelligence Orchestrator]
    ↓                    ↓
    │          [Rate Limiter: Check queue]
    │                    ↓
    │          [Semantic Model: Enrich prompt with EBITDA definition]
    │                    ↓
    │          [Claude API: Generate SQL/query + interpretation]
    ↓                    ↓
[Cache Check] ←────────┘
    ↓ (miss)
[Connector Factory]
    ↓
[Excel Adapter: Extract from P&Ls sheet]
    ↓
[Transform to unified model]
    ↓
[Cache Store: 5 min TTL]
    ↓
[Claude: Contextual response with insights]
    ↓
[UI: Display "$9.2M EBITDA, down 3% from target due to margin gap"]
```

### Request Flow: Account Plan Intelligence Generation

```
[User clicks: "Generate Account Plan for Customer #47"]
    ↓
[Account Plans UI] → [Intelligence Orchestrator]
    ↓                        ↓
    │              [Queue: Priority = MEDIUM]
    │                        ↓
    │              [Fetch customer data from multiple sources in parallel]
    │                        ↓
    ├──────┬──────┬──────────┴─────────┬────────┐
    │      │      │                    │        │
[Salesforce] [Financial] [Notion] [Excel] [External News]
    │      │      │                    │        │
    └──────┴──────┴────────┬───────────┴────────┘
                           ↓
              [Semantic Model: Unify data models]
                           ↓
              [Cache Check: account:47:intel]
                           ↓ (miss)
              [Claude: Generate 7-tab intelligence]
                - Overview (health score, metrics)
                - Financials (ARR, payment history)
                - Organization (org chart from Salesforce)
                - Strategy (pain points, opportunities)
                - Competitive (competitors, market position)
                - Intelligence (recent news, industry trends)
                - Action Items (recommended next steps)
                           ↓
              [Cache Store: 15 min TTL]
                           ↓
              [UI: Display rich 7-tab account plan]
```

### Request Flow: Scenario Modeling

```
[User changes: "Increase Cloudsense pricing by 10%"]
    ↓
[Scenario Modeler UI] → [Scenario Engine]
    ↓                           ↓
    │              [Dependency Graph: Identify affected metrics]
    │              - Revenue ↑ (direct effect)
    │              - Gross Margin ↑ (Revenue increases, COGS stable)
    │              - Net Margin ↑ (Margin gap narrows)
    │              - EBITDA ↑ (Revenue increases flows through)
    │                           ↓
    │              [Recalculate all dependent metrics]
    │                           ↓
[Intelligence Orchestrator]
    ↓
[Claude: Impact Analysis]
    - "10% price increase → $800K additional Q1 revenue"
    - "Margin gap narrows from -$918K to -$118K"
    - "EBITDA test: PASS (with caveats)"
    - "Risk: Customer churn if not positioned correctly"
    - "Recommendation: Phase increase over 2 quarters"
    ↓
[UI: Display before/after metrics + Claude insights]
```

### State Management

```
[Semantic Model Cache] ←→ [Redis/In-Memory]
    ↑ (subscribe to changes)
    │
[UI Components] ←→ [React Context/Zustand Store]
    ↑
[User Actions] → [Action Dispatchers] → [API Calls] → [Intelligence Orchestrator]
                                                            ↓
                                                    [Data Adapters]
                                                            ↓
                                                    [Data Sources]
```

### Key Data Flows

1. **Dashboard Rendering Flow:** UI loads → Check cache → If miss, fetch from Excel adapter → Transform via semantic model → Cache for 5 min → Render with Chart.js
2. **Account Intelligence Flow:** User request → Queue (priority=MEDIUM) → Parallel fetch from 5 sources → Semantic unification → Claude enrichment → Cache 15 min → Display
3. **Scenario Calculation Flow:** User input → Dependency graph recalculation → Claude impact analysis → Return results + insights
4. **Natural Language Flow:** Text input → Claude query generation → Connector factory data retrieval → Semantic model formatting → Claude response enrichment → Display

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Demo (1 user, 24 hours) | Single-server Node.js app, in-memory cache acceptable, manual refresh OK, queue-based Claude rate limiting sufficient |
| Pilot (10 users, 1 week) | Add Redis cache, implement proper session management, optimize Claude prompt token usage, add error handling/retries |
| Production (50+ users, ongoing) | Microservices architecture (split UI, Intelligence, Data tiers), database for persistent storage (PostgreSQL), horizontal scaling of intelligence orchestrator, implement authentication/authorization, WebSocket for real-time updates |

### Scaling Priorities

1. **First bottleneck:** Claude API rate limits when multiple users query simultaneously
   - **Fix:** Queue-based orchestration with prioritization (already in architecture)
   - **Enhancement:** Implement request batching where possible, cache common queries aggressively

2. **Second bottleneck:** Data source connection pooling when adapters hit API limits
   - **Fix:** Connection pooling for Salesforce/external APIs, batch data fetches during off-peak
   - **Enhancement:** Background refresh jobs to pre-populate cache before business hours

3. **Third bottleneck:** Real-time intelligence refresh latency (15-min cache too stale)
   - **Fix:** Event-driven architecture with webhooks from Salesforce/financial system
   - **Enhancement:** Incremental refresh (only update changed records) vs. full refresh

## Anti-Patterns

### Anti-Pattern 1: Direct Claude API Calls from UI Components

**What people do:** UI components directly call Claude API when user clicks "Generate Insights" button

**Why it's wrong:**
- Rate limit failures when multiple users act simultaneously
- No request prioritization (background enrichment blocks user queries)
- Prompt engineering scattered across codebase (inconsistent quality)
- No caching (same question asked twice = 2x Claude calls)

**Do this instead:** All Claude requests flow through the Intelligence Orchestrator with queuing, prioritization, and caching

### Anti-Pattern 2: Tightly Coupled Data Adapters

**What people do:** Each UI component directly imports and uses specific adapter classes (e.g., `import ExcelAdapter from 'data/excel'`)

**Why it's wrong:**
- Cannot swap data sources without changing UI code
- Parallel development blocked (UI dev needs adapter complete first)
- Testing requires real data sources
- No unified data model (different UI components interpret data differently)

**Do this instead:** UI components query the Semantic Model, which routes requests through the Connector Factory. Adapters are loaded dynamically via registry.

### Anti-Pattern 3: Synchronous External Intelligence Fetching

**What people do:** When rendering account plan, synchronously fetch news from external API → wait for response → then continue rendering

**Why it's wrong:**
- External API latency blocks entire page render (could be 2-5 seconds)
- API failures crash the page
- User stares at loading spinner
- No caching = same news fetched every page load

**Do this instead:** Background job pre-fetches and caches external intelligence every 15 minutes. UI renders immediately from cache with "Last updated 8 minutes ago" indicator. Manual refresh button available.

### Anti-Pattern 4: Storing Business Logic in Multiple Places

**What people do:** ARR calculation formula lives in Excel file, duplicated in Python analysis script, duplicated again in scenario modeler, duplicated in dashboard

**Why it's wrong:**
- Formula changes require updates in 4 places (guaranteed inconsistency)
- Different implementations produce different results
- No single source of truth
- Debugging nightmare when numbers don't match

**Do this instead:** Semantic Model is the single source of truth for all business logic. Adapters provide raw data, Semantic Model applies formulas, UI displays results.

### Anti-Pattern 5: Real-Time Data When Cached Data Suffices

**What people do:** Fetch live Salesforce data every time user navigates to account plan

**Why it's wrong:**
- Unnecessary API calls (expensive, slow, hits rate limits)
- Salesforce account data doesn't change every minute
- Slower user experience
- Scales poorly

**Do this instead:** Cache Salesforce data for 15 minutes. Display cache timestamp. Provide manual refresh button if user needs latest. Background job refreshes cache proactively.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude API (Anthropic) | REST API with queue-based orchestration | Priority queue, rate limiting, prompt caching enabled. Use Claude Opus 4.6 for complex intelligence, Sonnet 4.5 for simpler queries (cost optimization) |
| Salesforce CRM | REST API with OAuth 2.0 authentication | Use Salesforce Connect semantic layer if available. API-led integration via standard REST endpoints. Batch queries to reduce API calls |
| Financial System (GL) | Direct database connection or REST API | Depends on system. Prefer read-only replica if available. Schedule batch pulls during off-peak hours |
| Notion Database | Notion API (GraphQL/REST) | Use Notion's database API for structured queries. Cache responses aggressively (Notion rate limits are strict) |
| News APIs (external intelligence) | REST API with caching | Use aggregators like NewsAPI, Alpha Vantage for market data. 15-min cache TTL. Background polling to avoid user-blocking fetches |
| Excel Budget Files | File system access with openpyxl | REUSE existing Python parsing logic. Consider converting to JSON/database for faster access. For demo, direct file reading acceptable |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ Intelligence Layer | REST API (HTTP/JSON) | Async request/response. WebSocket for long-running Claude queries (streaming responses for better UX) |
| Intelligence ↔ Data Layer | Internal function calls (same process for demo) | For production, use gRPC or message queue. For 24-hour demo, direct function calls acceptable |
| Scenario Engine ↔ Semantic Model | Synchronous function calls | Scenario calculations need immediate access to metric definitions. No need for async |
| Cache Layer ↔ All Components | Redis client (for production) / In-memory Map (for demo) | All components check cache before expensive operations. 15-min TTL for external data, 5-min for financial |
| Account Plans ↔ Real-Time Intelligence | Event-driven polling with cache | Background job fetches news every 15 minutes. UI subscribes to cache updates |

## Build Order for 24-Hour Demo

### Critical Path Analysis

**Phase 1: Foundation (Hours 0-6)**
Build these in parallel—no dependencies:

1. **Data Foundation**
   - Excel adapter (REUSE existing Python code)
   - Semantic model schema (define metrics: ARR, EBITDA, Net Margin, etc.)
   - Connector factory interface

2. **Intelligence Layer**
   - Claude orchestrator with queue
   - Prompt templates for each use case
   - Rate limiter

3. **Cache Layer**
   - In-memory cache implementation (simple Map for demo)
   - TTL management

**Phase 2: Core Capabilities (Hours 6-16)**
Build these sequentially or with 2 parallel tracks:

**Track A (Intelligence Features):**
4. Account Plan generator
   - 7-tab structure
   - Claude integration for intelligence generation
   - Mock data for 140 customers initially

5. Natural Language Query interface
   - Chat UI
   - Query routing to Claude
   - Data visualization of results

**Track B (Analysis Features):**
6. Scenario Modeling engine
   - Dependency graph
   - Financial scenario templates
   - Claude impact analysis

7. Enhanced Dashboard
   - Integrate with semantic model
   - Real-time (cached) data updates
   - REUSE existing Chart.js visualizations

**Phase 3: Integration & Polish (Hours 16-22)**
8. Data source integration
   - Salesforce adapter (if credentials available, otherwise mock)
   - External intelligence APIs
   - Notion connector (if credentials available)

9. Real-time intelligence aggregation
   - Background polling for news
   - Cache population

**Phase 4: Demo Readiness (Hours 22-24)**
10. End-to-end testing
11. Demo data population (140 accounts)
12. Manual refresh buttons
13. Error handling (graceful degradation if Claude/external APIs unavailable)

### Parallel Development Strategy

```
Hour 0-6:
  Agent/Session 1: Data Foundation (Excel, Semantic Model)
  Agent/Session 2: Intelligence Layer (Claude orchestrator)
  Agent/Session 3: Cache Layer + UI scaffolding

Hour 6-12:
  Agent/Session 1: Account Plans (7-tab system)
  Agent/Session 2: Scenario Modeler (dependency graph)
  Agent/Session 3: Dashboard Enhancement

Hour 12-18:
  Agent/Session 1: NL Query Interface
  Agent/Session 2: External integrations (Salesforce, News)
  Agent/Session 3: Real-time intelligence

Hour 18-24:
  All Sessions: Integration testing, demo data, polish
```

**Key Insight:** The architecture is designed for maximum parallelizability. The Semantic Model is the only shared dependency—once its interface is defined (Hour 2), all other components can build against that interface simultaneously.

## Sources

### AI-Powered BI Architecture (2026)
- [Databricks AI Business Intelligence](https://www.databricks.com/product/business-intelligence)
- [Cloudera 2026 AI Architecture Predictions](https://www.cloudera.com/blog/business/2026-predictions-the-architecture-governance-and-ai-trends-every-enterprise-must-prepare-for.html)
- [Sigmoid: 6 BI Trends in 2026](https://sigmoidanalytics.medium.com/6-bi-trends-in-2026-smarter-faster-and-ai-driven-53ecf2e0abba)
- [ThoughtSpot: Data BI Solutions 2026 Architecture Guide](https://www.thoughtspot.com/data-trends/business-intelligence/data-bi-solutions)

### Modern Data Platform Components
- [Alation: Modern Data Stack 2026](https://www.alation.com/blog/modern-data-stack-explained/)
- [Devoteam: AI & Agentic-ready Data Platforms](https://www.devoteam.com/expert-view/ai-data-platforms/)
- [Microsoft Azure: Modern Data Platform Architecture](https://learn.microsoft.com/en-us/azure/architecture/solution-ideas/articles/small-medium-modern-data-platform)
- [Airbyte: Data Integration Architecture 2026](https://airbyte.com/data-engineering-resources/data-integration-architecture)

### LLM Integration Patterns
- [ArXiv: DBMS-LLM Integration Strategies](https://arxiv.org/html/2507.19254v1)
- [ArXiv: LLM Applications - Current Paradigms](https://arxiv.org/html/2503.04596v2)
- [Latitude: 5 Patterns for Scalable LLM Service Integration](https://latitude-blog.ghost.io/blog/5-patterns-for-scalable-llm-service-integration/)
- [SaM Solutions: Enterprise LLM Architecture](https://sam-solutions.com/enterprise-llm-architecture/)

### Real-Time Intelligence & RAG
- [Cloudera: 2026 Architecture Trends](https://www.cloudera.com/blog/business/2026-predictions-the-architecture-governance-and-ai-trends-every-enterprise-must-prepare-for.html)
- [Techment: RAG in 2026 for Enterprise AI](https://www.techment.com/blogs/rag-in-2026-enterprise-ai/)
- [O'Reilly: Signals for 2026](https://www.oreilly.com/radar/signals-for-2026/)

### Scenario Modeling Architecture
- [Workday: Scenario Modeling Framework](https://blog.workday.com/en-us/scenario-modeling-101-framework-strategic-financial-planning.html)
- [Oracle: Scenario Modeling in Planning](https://www.oracle.com/performance-management/planning/what-is-scenario-planning/modeling/)
- [Drivetrain: AI Financial Modeling Tools 2026](https://www.drivetrain.ai/solutions/ai-financial-modeling-tools-for-businesses)

### CRM & Account Planning Architecture
- [SyncMatters: CRM Predictions 2026](https://syncmatters.com/blog/crm-predictions-for-the-future-of-customer-relationship-management)
- [Solutions Review: CRM Redesigned in 2026](https://solutionsreview.com/crm/2026/02/02/how-crm-is-being-redesigned-from-the-ground-up-in-2026/)
- [IBM: CRM-ERP Integration](https://www.ibm.com/think/topics/crm-erp-integration)

### Data Integration with Salesforce & Excel
- [Salesforce Architects: Data Integration Patterns](https://architect.salesforce.com/decision-guides/data-integration)
- [Salesforce: Integration Patterns and Practices Spring '26](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/integration_patterns_and_practices.pdf)
- [CData: External Data Integration with Salesforce](https://www.cdata.com/blog/smarter-cheaper-external-data-integration-salesforce)

### Rapid Prototyping & Parallel Development
- [WeWeb: Rapid Application Development 2026 Guide](https://www.weweb.io/blog/rapid-application-development-rad-complete-guide)
- [Synergy Labs: Design-Focused Development Platforms 2026](https://www.synergylabs.co/blog/design-focused-development-platforms-2026)

### Claude API Integration
- [Claude: How to Integrate APIs Seamlessly](https://claude.com/blog/integrate-apis-seamlessly)
- [HashBuilds: Claude API Rate Limits Production Scaling](https://www.hashbuilds.com/articles/claude-api-rate-limits-production-scaling-guide-for-saas)
- [O'Reilly: Reverse Engineering Architecture with Claude Code](https://www.oreilly.com/radar/reverse-engineering-your-software-architecture-with-claude-code-to-help-claude-code/)

---
*Architecture research for: Skyvera AI-Powered Business Intelligence Platform*
*Researched: 2026-02-08*
*Confidence: HIGH (verified with multiple authoritative sources)*
