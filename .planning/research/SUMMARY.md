# Project Research Summary

**Project:** AI-Powered Business Intelligence Platform for Skyvera
**Domain:** Multi-BU SaaS Business Intelligence with AI-Powered Account Planning and Scenario Modeling
**Researched:** 2026-02-08
**Confidence:** HIGH

## Executive Summary

Skyvera needs an AI-powered business intelligence platform that combines executive dashboards, account planning for 140 customers, and what-if scenario modeling—all with a 24-hour demo deadline. Based on comprehensive research, the recommended approach centers on Next.js 15 with React Server Components, Claude Opus 4.6/Sonnet 4.5 for intelligence, and shadcn/ui for rapid UI development. The architecture follows a three-tier intelligence-first pattern: presentation (UI modules), intelligence orchestration (Claude API with semantic layer), and data foundation (adapters for Excel, Salesforce, Notion, external APIs).

The critical success factor is treating Claude AI as the orchestration center, not an add-on. All data flows through a semantic layer that provides consistent business metric definitions across multiple source systems. This prevents the most dangerous pitfall: unreliable AI outputs breaking user trust through incorrect financial calculations or inconsistent data. The 24-hour constraint demands aggressive caching (15-minute TTL), pre-generated intelligence, and a "good enough" over perfect philosophy—but never compromising on data accuracy or error handling.

Key risks include API rate limits (Claude and Salesforce), data quality inconsistencies across sources (Excel vs Salesforce), and prompt engineering failures under load. Mitigation strategies are built into the architecture: queue-based Claude orchestration prevents rate limit failures, semantic layer reconciles conflicting data sources, and structured prompt templates with caching ensure reliable AI outputs. The roadmap must prioritize foundation work (data layer, semantic model, Claude orchestrator) before any user-facing features to avoid cascading architectural problems.

## Key Findings

### Recommended Stack

The stack prioritizes speed, developer experience, and Claude integration for the 24-hour deadline. Next.js 15 delivers 76.7% faster local server startup with Turbopack, React Server Components reduce client-side JavaScript, and shadcn/ui provides copy-paste components that can reduce UI development time by 80%+. The AI layer uses Claude Opus 4.6 for complex strategic analysis, Sonnet 4.5 for real-time queries, and Haiku 4.5 for high-volume batch processing. NewsAPI.ai provides real-time business intelligence with full-text article access and advanced enrichment (entities, sentiment, clustering).

**Core technologies:**
- **Next.js 15 with React 19**: Full-stack framework with React Server Components for blazing fast iteration and reduced client JS. Built-in API routes perfect for Claude/external API proxy layer.
- **Claude Opus 4.6 / Sonnet 4.5**: Official Anthropic SDK with TypeScript support. Opus for strategic account planning and complex reasoning, Sonnet for fast intelligent responses in natural language queries. 1M token context window with adaptive thinking.
- **shadcn/ui + Tailwind CSS 4**: Copy-paste component library (not npm dependency) with dashboard templates and charts. Tailwind v4 offers 5x faster builds. Critical for 24-hour deadline—can generate initial UI via Vercel v0 from prompts.
- **TanStack Query + Zustand**: Industry standard server state management (TanStack Query v5) for caching and background updates. Zustand for lightweight client state. Pair perfectly for scenario modeling and real-time intelligence.
- **SQLite + Prisma ORM**: Zero-setup local database for demo (file-based, no server). Type-safe Prisma client with migrations and Studio GUI. Easily migrates to PostgreSQL post-demo.
- **NewsAPI.ai**: Leading business news API with full-text access, entity extraction, sentiment analysis, and clustering. Superior to alternatives for enrichment capabilities.

**Critical version requirements:**
- Next.js 15.x requires Node.js 18.18.0+ (recommend 20.x LTS)
- Next.js 15 requires React 19.x
- TanStack Query v5.x fully compatible with React 19
- Claude Opus 3 models retired Jan 5, 2026—must use Opus 4.6 or 4.5

**What NOT to use:**
- Create React App (deprecated 2023)
- Redux (too much boilerplate for 24-hour demo—use Zustand)
- Real-time everything (causes decision fatigue—use 15-minute cache refresh)
- MongoDB (SQLite/PostgreSQL better for relational business data)
- Direct Chart.js (use shadcn/ui chart components instead)

### Expected Features

The feature landscape divides into table stakes (users expect), differentiators (competitive advantage), and anti-features (commonly requested but problematic). Research shows account health scoring, financial KPI dashboards, and multi-BU revenue breakdowns are baseline expectations—missing these makes the product feel incomplete. The real differentiation comes from natural language query ("Show me at-risk accounts in APAC"), AI-powered what-if scenarios, real-time news intelligence integration, and proactive anomaly detection. Critically, the research identifies anti-features to avoid: real-time everything (creates decision fatigue), unlimited custom dashboards (sprawl nightmare), 100+ KPIs on one screen (information overload), and complete data history (storage costs + analysis paralysis).

**Must have (table stakes):**
- **Financial KPI Dashboard** — Already exists (Business_Analysis_Dashboard.html), polish for demo. Core BI expectation.
- **Multi-BU Revenue Breakdown** — Already exists (Cloudsense, Kandy, STL tracking). Essential for multi-division companies.
- **Account Health Scoring** — Combine usage, engagement, support, financial metrics into single red/yellow/green score per account. Missing = incomplete product.
- **Customer List/Directory** — Already exists (140+ customer pages). Fundamental account planning feature.
- **What-If Scenario Lab** — Already exists (scenario-lab.html). Table stakes for financial planning tools.

**Should have (competitive):**
- **Natural Language Query** — "Show me at-risk accounts in APAC" removes BI bottleneck, democratizes data. Follow Looker Conversational Analytics pattern (LLM + semantic layer).
- **Real-Time News Intelligence** — Auto-fetch customer news/events for account context. Scripts exist (fetch_customer_news.py)—integrate into dashboards. UNIQUE differentiator.
- **AI-Powered What-If Scenarios** — Conversational interface: "What if churn increases 2%?" with instant model updates. Enhance existing scenario-lab.html.
- **Proactive Anomaly Detection** — AI monitors KPIs, alerts when metrics deviate. Differentiates from passive BI tools.
- **Customer Intelligence Synthesis** — Auto-generate account context from multiple sources. Scripts exist (generate_customer_intelligence.py). UNIQUE differentiator.
- **Automatic Insight Generation** — "Cloudsense margin declined 2.3% due to Salesforce UK contract" using ML attribution + NLG.

**Defer (v2+):**
- **Stakeholder Network Mapping** — Relationship graphs within accounts. Specialized use case, not demo-critical.
- **Cross-Account Pattern Recognition** — "Accounts like Telstra that are expanding." Requires substantial ML clustering work.
- **Embedded Analytics in Email** — Daily digest emails. Delivery mechanism, not core insight value.
- **Mobile App** — Complex BI doesn't work on 6" screen. Use responsive web for demo, defer native app.

**Anti-features to avoid:**
- **Real-time Everything** — Match refresh to decision cadence (daily/weekly for quarterly planning, not intraday volatility). Use 15-minute cache.
- **Unlimited Custom Dashboards** — Dashboard sprawl, 60-80% unused. Provide 3-5 role-based templates instead.
- **100+ KPIs on One Screen** — Information overload. Prioritize 3-5 key metrics per view, link to detail pages.
- **Complete Data History** — Use rolling 24-month window. Archive older data.
- **Dozens of Scenario Types** — Focus on 3 core scenarios (Base/Optimistic/Pessimistic) + 1-2 custom slots.

### Architecture Approach

The recommended architecture follows a three-tier intelligence-first pattern where Claude AI is the orchestration center, not an add-on. All data sources (Excel, Salesforce, Notion, external APIs) feed into a semantic layer that provides unified business metric definitions—this prevents data dialect problems where different systems use different terminology for the same concept. The intelligence orchestration layer implements queue-based rate limiting for Claude API calls, enriches prompts with semantic context, and caches responses aggressively. The architecture is designed for maximum parallelizability: once the semantic model interface is defined, all components can build simultaneously.

**Major components:**

1. **Presentation Tier (Four parallel UI modules)** — Dashboard (enhanced existing), Account Plans (new 7-tab interface), Scenario Modeler (what-if engine), NL Query Interface (chat UI). Can be built simultaneously by different agents/sessions once semantic layer interface defined.

2. **Intelligence Orchestration Layer (Single Claude service)** — Prompt routing based on UI context, response enrichment from semantic model, real-time + historical data synthesis, queue-based rate limit management. ALL Claude requests flow through this layer—no direct UI-to-Claude calls. Implements priority queue (NL queries = high priority, background enrichment = low priority).

3. **Data Foundation Tier (Five adapter modules)** — Excel Budget Parser (reuse existing openpyxl code), Salesforce Connector (API-led), Financial System (GL data), Notion Database (GraphQL/REST), External Intelligence (news APIs). Each implements standardized DataAdapter interface for parallel development. Connector Factory dynamically routes requests to appropriate adapters.

4. **Semantic Layer (Intelligence gateway)** — Single source of truth for all business metrics. Defines "ARR = Quarterly RR × 4," "Net Margin = (Revenue - COGS - Expenses) / Revenue," etc. Provides GraphRAG knowledge graph for Claude agent access. All data queries flow through semantic layer, which resolves metrics from appropriate source systems and applies business logic consistently.

5. **Cache Layer (Performance optimization)** — Redis for production, in-memory Map acceptable for demo. 15-minute TTL for external intelligence, 5-minute TTL for financial data. Implements manual refresh button for demo. All components check cache before expensive operations.

**Critical architectural patterns:**

- **Intelligence Orchestration with Queue-Based Rate Limiting** — Prevents Claude API rate limit failures when multiple users act simultaneously. Enables request prioritization. Centralizes prompt engineering for consistency.
- **Semantic Layer as Intelligence Gateway** — Eliminates data inconsistencies. Single source of truth for business logic. Enables GraphRAG for agent access.
- **Adapter Registry with Parallel Development** — Standardized interface allows building all adapters simultaneously. Clean separation of concerns. Easy to add new sources.
- **Cache-First with Manual Refresh** — Dramatically faster response times. Acceptable data staleness (15 minutes) for demo. Manual refresh available.
- **Scenario Dependency Graph** — Automatically recalculates dependent metrics when user changes inputs. Prevents inconsistent states in what-if analysis.

**Build order for 24-hour demo:**

Hours 0-6 (Foundation): Data Foundation + Intelligence Layer + Cache Layer in parallel. No dependencies. Parse actual Skyvera Excel file in first hour to understand real data structure.

Hours 6-16 (Core Capabilities): Two parallel tracks—Track A (Account Plans + NL Query) and Track B (Scenario Modeler + Enhanced Dashboard). Requires foundation from previous phase.

Hours 16-22 (Integration & Polish): Data source integration (Salesforce, NewsAPI.ai, Notion) + real-time intelligence aggregation + cache population.

Hours 22-24 (Demo Readiness): End-to-end testing, demo data population for 140 accounts, manual refresh buttons, error handling with graceful degradation.

### Critical Pitfalls

Research identified seven critical pitfalls that can make the demo fail or create unfixable architectural problems within 24 hours. The most dangerous is unreliable AI outputs breaking user trust—KPMG research shows 66% of employees rely on AI output without validation and 56% report making mistakes because of it. For a financial platform, one wrong EBITDA calculation destroys credibility instantly. Other critical failures include API rate limits during demo (Salesforce 100K/day limit, Claude timeouts), data quality inconsistencies (Excel shows $8M ARR, Salesforce shows $6.4M), and scenario modeling producing impossible outputs (negative headcount, 200% margins).

1. **Unreliable AI Outputs Breaking User Trust** — Claude generates plausible but incorrect insights or financial calculations. Users see wrong numbers, lose trust immediately. **Prevention:** Add explicit prompt constraints ("If unsure, say 'Insufficient data'—never guess financial numbers"). Structure prompts: Context → Constraints → Output format → Verification checklist. For financial calculations, Claude generates formulas/logic but actual math happens in validated code. Show data sources and assumptions alongside AI insights. **Demo impact:** DEMO BREAKER. Wrong EBITDA destroys credibility instantly.

2. **API Rate Limits and Performance Bottlenecks** — Salesforce hits 100K/day limit. Claude API times out (30-60 seconds on long context). Dashboard hangs. Excel parsing blocks UI for 30+ seconds. **Prevention:** Pre-load 140 customers into local cache, use Bulk API for initial load. Cache Claude responses aggressively—same query returns cached result. Parse Excel once at startup, store in memory/SQLite. Pre-fetch data during navigation. **Demo impact:** DEMO BREAKER. 30-second hang while switching accounts destroys flow.

3. **Data Quality and Integration Inconsistencies** — Account plan shows $8M ARR, Excel shows $6.4M. Metrics don't match manual calculations. Multiple sources contradict. Research shows 90% of spreadsheets contain errors. **Prevention:** Define single source of truth per metric. Implement data validation on import (ranges, types, required fields). Build reconciliation dashboard showing freshness timestamps and source system. Test with real Skyvera Excel file by Hour 4. **Demo impact:** DEMO BREAKER. Executive spots inconsistency, entire platform credibility questioned.

4. **Scenario Modeling Producing Unrealistic Outputs** — Scenarios generate impossible outcomes: negative headcount, 200% margins, revenue declining while inputs increase. McKinsey found 40% of scenarios ineffective because they prioritize unlikely events. **Prevention:** Start with Excel formulas that work. Implement bounds checking (revenue 0-2x baseline, margins 0-100%, headcount integer ≥ 0). Validate outputs before display. Show explicit assumptions. Use narrative-driven scenario names ("Lost major customer" not "Pessimistic"). **Demo impact:** CREDIBILITY DAMAGE. Unrealistic outputs look amateurish.

5. **Claude Prompt Engineering Failures Under Load** — Prompts that worked in testing fail with real data. Claude takes 45+ seconds. Inconsistent outputs. Context limits (200K tokens) exceeded with large Excel files. **Prevention:** Use structured prompt template (CONTEXT → CONSTRAINTS → OUTPUT FORMAT → VERIFICATION). Explicit uncertainty handling. Don't send full Excel file—extract relevant rows/columns only. Cache identical prompts for 5 minutes. Timeout after 30 seconds, retry once, then show cached/fallback data. **Demo impact:** DEMO FLOW KILLER. Long pauses waiting for Claude destroy momentum.

6. **Natural Language Query Misinterpretation** — User asks "Show me top customers," gets wrong results (sorted by name not revenue). Ambiguous queries produce incorrect data. Modern LLMs achieve 85-95% accuracy for common queries but drop significantly for complex/ambiguous questions. **Prevention:** Use semantic layer approach—map common business terms to specific metrics beforehand ("margin" → Net Margin %, "top customers" → sorted by Quarterly RR descending). Clarification dialogue for low-confidence interpretations. Show interpretation: "Showing: Top 10 customers by Quarterly RR (Cloudsense only)". **Demo impact:** DEMO CONFUSER. Wrong NL results make platform look unreliable.

7. **"Looks Done But Isn't" - Missing Critical Edge Cases** — Happy path works, but edge cases crash: customer with no revenue data, account with missing Salesforce ID, division by zero, null displayed as "undefined". **Prevention:** Test with real Skyvera data by Hour 6 (actual Excel file, all 140 customers including edge cases). Defensive programming: null checks `customer?.name ?? 'Unknown'`, division by zero checks, date parsing validation. Error boundaries catch React errors. Form validation before submission. Handle missing data gracefully ("No data" not "undefined"). **Demo impact:** DEMO STOPPER. One crash during live demo is fatal.

## Implications for Roadmap

Based on research, the roadmap should follow a strict foundation-first approach. The architecture requires a working semantic layer and Claude orchestrator before any user-facing features can function reliably. Attempting to build features first then retrofit intelligence creates unfixable data inconsistency and prompt engineering problems. The 24-hour constraint demands aggressive parallelization once foundations are in place.

### Suggested Phase Structure

**Phase 1: Foundation & Intelligence Core (Hours 0-6)**

**Rationale:** All subsequent features depend on reliable data access and Claude integration. Building features without this foundation causes cascading architectural problems. Semantic layer must be defined first to enable parallel feature development.

**Delivers:**
- Semantic model with business metric definitions (ARR, EBITDA, Net Margin, etc.)
- Data adapter interface and connector factory
- Excel budget parser (reuse existing openpyxl code)
- Claude orchestration service with queue-based rate limiting
- Structured prompt templates with caching
- In-memory cache layer with 15-minute TTL

**Addresses features:**
- Foundation for all table stakes features (dashboards, account plans)
- Enables Natural Language Query (semantic layer required)
- Supports Customer Intelligence Synthesis (Claude orchestrator required)

**Avoids pitfalls:**
- **Unreliable AI Outputs** — Structured prompt templates with constraints prevent hallucination
- **Data Quality Inconsistencies** — Semantic layer as single source of truth
- **Prompt Engineering Failures** — Queue-based orchestration with caching prevents rate limits

**Research flag:** Standard patterns well-documented. No deep research needed during phase execution.

---

**Phase 2: Data Integration & Validation (Hours 6-12)**

**Rationale:** Must connect to real data sources and validate data quality before building user-facing features. Testing with fake data until Hour 18 guarantees demo failure when edge cases appear. Dependent on Phase 1 adapter interfaces.

**Delivers:**
- Salesforce CRM adapter with Bulk API integration
- Notion database connector
- External intelligence adapter (NewsAPI.ai)
- Data validation layer (ranges, types, required fields)
- Reconciliation logic for conflicting sources
- Cache population for 140 customer accounts
- Real Skyvera Excel file parsing with error handling

**Addresses features:**
- Enables Account Health Scoring (requires multi-source data)
- Supports Real-Time News Intelligence (NewsAPI.ai integration)
- Foundation for Proactive Anomaly Detection (requires historical data)

**Avoids pitfalls:**
- **API Rate Limits** — Bulk API usage, aggressive caching, pre-loading 140 customers
- **Data Quality Inconsistencies** — Validation on import, reconciliation dashboard
- **Missing Edge Cases** — Test with real Skyvera data including edge cases by end of phase

**Research flag:** May need API-specific research if Salesforce/Notion credentials reveal unexpected integration patterns. Likely standard OAuth/REST patterns.

---

**Phase 3: Core UI & Dashboard Enhancement (Hours 12-16)**

**Rationale:** With data foundation solid and validated, can build UI rapidly using shadcn/ui components. Parallel development possible—Dashboard and Account Plans can build simultaneously. Dependent on Phase 2 data availability.

**Delivers:**
- Enhanced financial KPI dashboard (leverage existing Business_Analysis_Dashboard.html)
- Multi-BU revenue breakdown views
- Account directory with search/filter
- Account health scoring visualization (red/yellow/green)
- Data refresh indicators with "Last updated" timestamps
- Basic export to CSV functionality

**Addresses features:**
- **Financial KPI Dashboard** (table stakes, already exists—polish)
- **Multi-BU Revenue Breakdown** (table stakes, already exists)
- **Account Health Scoring** (table stakes—MUST ADD)
- **Customer List/Directory** (table stakes, already exists—enhance)

**Avoids pitfalls:**
- **"Looks Done But Isn't"** — Error boundaries, loading states, null handling built into every component
- **Performance Bottlenecks** — Lazy loading, virtual scrolling for 140-item lists

**Research flag:** No research needed. Standard React/shadcn/ui patterns well-documented.

---

**Phase 4: Scenario Modeling Engine (Hours 16-18)**

**Rationale:** Leverage existing scenario-lab.html structure. Focus on validation and bounds checking to avoid unrealistic outputs. Can develop in parallel with Phase 5 (NL Query) as both depend on Phase 1-2 foundations but not on each other.

**Delivers:**
- Enhanced scenario-lab.html with validation layer
- Scenario dependency graph for automatic recalculation
- Bounds checking (revenue 0-2x baseline, margins 0-100%, HC integer ≥ 0)
- Financial scenario templates (pricing, cost, margin)
- Headcount planning scenarios
- Customer scenarios (churn, acquisition)
- Claude-powered impact analysis ("10% price increase → $800K additional Q1 revenue")
- Before/after metric comparison with color-coding

**Addresses features:**
- **What-If Scenario Lab** (table stakes, enhance existing)
- **AI-Powered What-If Scenarios** (competitive differentiator)

**Avoids pitfalls:**
- **Scenario Producing Unrealistic Outputs** — Validation rules, bounds checking, explicit assumptions
- **Unreliable AI Outputs** — Claude generates insights but validated code does calculations

**Research flag:** Standard patterns. Financial modeling well-documented. No deep research needed.

---

**Phase 5: Natural Language Query Interface (Hours 18-20)**

**Rationale:** Builds on semantic layer from Phase 1. Can develop in parallel with Phase 4. Critical differentiator for "AI-powered" demo story. Must handle ambiguity gracefully to avoid credibility damage.

**Delivers:**
- Chat UI with history
- Natural language query routing to Claude via orchestrator
- Semantic layer integration for query interpretation
- Clarification dialogue for ambiguous queries (<85% confidence)
- Curated metrics catalog (20-30 pre-defined common queries)
- Query interpretation display ("Showing: Top 10 customers by Quarterly RR")
- Dynamic visualization of results
- Graceful failure with examples

**Addresses features:**
- **Natural Language Query** (competitive differentiator—CRITICAL for AI-powered story)

**Avoids pitfalls:**
- **NL Query Misinterpretation** — Semantic layer maps terms, clarification dialogue, show interpretation
- **Prompt Engineering Failures** — Structured templates, caching, context management

**Research flag:** May need research on semantic query parsing patterns if implementation challenges arise. Looker Conversational Analytics pattern documented.

---

**Phase 6: Real-Time Intelligence & Account Plans (Hours 20-22)**

**Rationale:** Combines all previous work into comprehensive account plans. Real-time intelligence integration uses adapters from Phase 2. 7-tab account plan structure requires UI components from Phase 3 and Claude intelligence from Phase 1.

**Delivers:**
- 7-tab account plan interface (Overview, Financials, Organization, Strategy, Competitive, Intelligence, Action Items)
- Claude-generated account intelligence synthesis
- Real-time news integration from NewsAPI.ai
- Customer intelligence from generate_customer_intelligence.py surfaced in UI
- Proactive alerts dashboard ("3 accounts at risk, Salesforce contract renewal in 30 days")
- Background polling for news (15-minute refresh)
- Embedded intelligence on account pages

**Addresses features:**
- **Customer Intelligence Synthesis** (competitive differentiator—UNIQUE)
- **Real-Time News Intelligence** (competitive differentiator—UNIQUE)
- **Proactive Anomaly Detection** (competitive differentiator)

**Avoids pitfalls:**
- **API Rate Limits** — Background polling with caching, not synchronous fetches blocking UI
- **Performance Bottlenecks** — Pre-cached intelligence, lazy loading tabs

**Research flag:** No deep research needed. Integration patterns established in Phase 2.

---

**Phase 7: Demo Prep & Hardening (Hours 22-24)**

**Rationale:** Feature freeze at Hour 22. Only bug fixes and demo preparation. Must have recovery strategies for every possible failure point.

**Delivers:**
- Full end-to-end demo flow testing (3x runs in actual demo environment)
- Demo data population and validation (140 accounts with realistic data)
- Manual refresh buttons visible in all views
- Error handling with graceful degradation (cached fallback data)
- Demo script with fallback paths
- Backup demo video
- Browser refresh state persistence (localStorage)
- Offline mode capability
- Performance optimization (ensure <2s initial load, <500ms transitions)

**Addresses:**
- All pitfalls with recovery strategies
- Demo environment preparation (WiFi, browser, screen size)
- Fallback plans for API failures

**Avoids pitfalls:**
- **All Critical Pitfalls** — Recovery strategies documented and tested
- **Demo Environment Surprises** — Test in actual venue/setup

**Research flag:** No research needed. Testing and validation phase.

---

### Phase Ordering Rationale

- **Foundation-first is non-negotiable:** Semantic layer and Claude orchestrator are dependencies for ALL features. Building features first then retrofitting intelligence creates unfixable data consistency and prompt engineering problems.

- **Data integration before UI prevents late surprises:** Testing with real Skyvera Excel file and 140 customer records by Hour 12 ensures edge cases surface early when fixable, not at Hour 23 during dress rehearsal.

- **Parallel tracks maximize throughput:** Once semantic layer interface defined (Hour 2), Dashboard/Account Plans/Scenario Modeler/NL Query can develop simultaneously by different agents/sessions. Architecture designed for maximum parallelizability.

- **Scenario Modeling and NL Query parallel development:** Both depend on Phase 1-2 foundations but not on each other. Can build simultaneously in Hours 16-20.

- **Real-time intelligence and Account Plans come late:** Requires all previous components (data adapters, Claude orchestrator, UI components, caching). Integrates everything.

- **Feature freeze at Hour 22:** Critical for stability. Finding unfixable bugs at Hour 23 kills demo. Last 2 hours are testing, not development.

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 2 (Data Integration):** IF Salesforce/Notion credentials reveal non-standard authentication or unexpected API patterns. Likely standard OAuth/REST but validate early.
- **Phase 5 (Natural Language Query):** IF semantic query parsing proves more complex than anticipated. Looker pattern is documented but implementation may surface edge cases.

**Phases with standard patterns (skip additional research):**

- **Phase 1 (Foundation):** Well-documented patterns for semantic layers, queue-based orchestration, prompt engineering. Multiple authoritative sources verified.
- **Phase 3 (Core UI):** React/shadcn/ui patterns extremely well-documented. No novel patterns required.
- **Phase 4 (Scenario Modeling):** Financial modeling and dependency graphs standard patterns. Excel-to-code translation straightforward.
- **Phase 6 (Real-Time Intelligence):** Integration patterns established in Phase 2. No new research needed.
- **Phase 7 (Demo Prep):** Testing and hardening. No research required.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with official Next.js 15 release notes, Claude API docs, shadcn/ui documentation, TanStack Query docs. All version compatibilities confirmed from authoritative sources. |
| Features | HIGH | Cross-verified with multiple 2026 BI platform analyses, account planning software reviews, scenario modeling guides. Feature expectations validated against Gartner reviews and domain expert sources. Anti-features confirmed through scope management research. |
| Architecture | HIGH | AI-native BI architecture patterns verified across multiple 2026 sources (Databricks, Cloudera, Sigmoid Analytics). LLM integration patterns from ArXiv papers and enterprise architecture guides. Semantic layer approach standard in modern BI platforms. |
| Pitfalls | HIGH | Critical pitfalls verified through multiple authoritative sources: KPMG research on AI reliability, Salesforce API documentation, McKinsey scenario planning research, prompt engineering best practices from Anthropic. 24-hour timeline pitfalls based on domain expertise in rapid prototyping. |

**Overall confidence:** HIGH

All four research areas verified with multiple authoritative sources and cross-referenced for consistency. Stack recommendations come from official documentation. Feature expectations validated against market leaders (Looker, Tableau, Gainsight). Architecture patterns confirmed in 2026 AI-native platform research. Pitfalls verified through both academic research (KPMG, McKinsey) and technical documentation (Salesforce, Anthropic).

### Gaps to Address

Despite high overall confidence, several areas need attention during planning/execution:

- **Salesforce API quota management:** While 100K/day base limit is documented, exact quota for Skyvera's Salesforce instance unknown. Need to check available API calls and licenses early in Phase 2. **Mitigation:** Implement API call monitoring from start, have fallback to cached data if approaching limit.

- **NewsAPI.ai free tier limitations:** Research confirmed NewsAPI.ai is leading provider, but specific quota limits for free tier need verification before committing to integration. **Mitigation:** Validate API quota in first hour of Phase 2, have fallback to alternative news API (Contify, Finnhub) if needed.

- **Notion database structure:** Research covers Notion API patterns, but actual structure of Skyvera's Notion database unknown until inspection. **Mitigation:** Inspect Notion structure early in Phase 2, adjust adapter accordingly. Graceful degradation if Notion integration unavailable.

- **Actual Skyvera data edge cases:** Research identified common edge cases (missing revenue data, null Salesforce IDs), but actual data quirks won't surface until parsing real Excel file and customer records. **Mitigation:** Parse real Skyvera Excel file by Hour 4, test with actual 140 customer records by Hour 12.

- **Demo environment constraints:** WiFi reliability, screen size, browser compatibility at demo venue unknown. **Mitigation:** Test in actual demo environment during Hours 22-24. Have offline mode and backup video ready.

- **Claude API performance with production data:** Research documents typical response times, but actual performance with Skyvera's Excel file size and 140 customer histories unknown until testing. **Mitigation:** Test Claude API with production-scale prompts by Hour 8. Implement aggressive caching and timeout logic from start.

## Sources

### Primary (HIGH confidence)

**Stack Research:**
- Next.js 15 Release Notes (nextjs.org/blog/next-15) — Official release announcement, Oct 21, 2024
- Claude API Release Notes (platform.claude.com/docs/en/release-notes/api) — Official Anthropic documentation, verified Feb 2026
- Anthropic SDK TypeScript (github.com/anthropics/anthropic-sdk-typescript) — Official SDK repository
- shadcn/ui Documentation (ui.shadcn.com) — Official component docs
- Tailwind CSS v4.0 Announcement (tailwindcss.com/blog/tailwindcss-v4) — Official release, Jan 22, 2025
- Prisma Documentation (prisma.io/docs) — Official ORM documentation
- TanStack Query Documentation (tanstack.com/query/latest) — Official library docs

**Features Research:**
- Top Business Intelligence Platforms of 2026 (knowledgehut.com/blog/business-intelligence-and-visualization/business-intelligence-platform)
- Gartner Analytics and BI Platforms Reviews 2026 (gartner.com/reviews/market/analytics-business-intelligence-platforms)
- 16 Best Account Planning Software Reviewed in 2026 (thecmo.com/tools/best-account-planning-software/)
- Looker Conversational Analytics GA Announcement (cloud.google.com/blog/products/business-intelligence/looker-conversational-analytics-now-ga/)

**Architecture Research:**
- Databricks AI Business Intelligence (databricks.com/product/business-intelligence)
- Cloudera 2026 AI Architecture Predictions (cloudera.com/blog/business/2026-predictions)
- ArXiv: DBMS-LLM Integration Strategies (arxiv.org/html/2507.19254v1)
- Latitude: 5 Patterns for Scalable LLM Service Integration (latitude-blog.ghost.io/blog/5-patterns-for-scalable-llm-service-integration/)

**Pitfalls Research:**
- KPMG: AI Reliability and Employee Trust (research on 66% reliance without validation)
- Salesforce API Limits Quick Reference (resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_app_limits_cheatsheet.pdf)
- McKinsey: Scenario Planning Effectiveness (40% ineffective scenarios research)
- Anthropic Prompt Engineering Best Practices (claude.com/blog/best-practices-for-prompt-engineering)

### Secondary (MEDIUM confidence)

- Best News APIs in 2025 (newsapi.ai/blog/best-news-api-comparison-2025/) — NewsAPI.ai recommended based on 2025 comparison
- React State Management in 2025 (dev.to) — Zustand recommendation based on community consensus
- 8 Best React Chart Libraries 2025 (embeddable.com/blog/react-chart-libraries) — Recharts comparison
- Vercel v0 Review 2025 (skywork.ai/blog/vercel-v0-dev-review-2025) — UI generation tool evaluation

### Tertiary (LOW confidence — needs validation)

- NewsAPI.ai free tier quota limits — Requires verification with actual API documentation before Phase 2
- Vercel v0 credit pricing — May change, check current pricing if using
- Performance benchmarks with Skyvera's specific data volume — Needs testing with production data

---

*Research completed: 2026-02-08*
*Ready for roadmap: YES*
