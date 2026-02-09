# Roadmap: Skyvera Business Intelligence Platform

## Overview

This roadmap delivers an AI-powered business intelligence platform in 24 hours, transforming Skyvera's fragmented Excel spreadsheets and static dashboards into a unified intelligent system. The journey follows a strict foundation-first approach: build reliable data access and Claude AI orchestration first (Phase 1), then layer on core platform features (Phase 2), add intelligent capabilities in parallel (Phase 3), integrate comprehensive account intelligence (Phase 4), and harden for demo (Phase 5). Every phase delivers observable user value while maintaining architectural integrity for the 24-hour deadline.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Integration** - Semantic layer, Claude orchestration, data adapters (Hours 0-8)
- [x] **Phase 2: Core Platform UI** - Enhanced dashboard, account directory, health scoring (Hours 8-14)
- [x] **Phase 3: Intelligence Features** - Scenario modeling + Natural language query (Hours 14-20)
- [ ] **Phase 4: Advanced Account Intelligence** - 7-tab account plans with real-time intelligence (Hours 20-22)
- [ ] **Phase 5: Demo Readiness** - Testing, hardening, demo preparation (Hours 22-24)

## Phase Details

### Phase 1: Foundation & Data Integration
**Goal**: System has reliable data access from all sources and Claude AI orchestration for intelligence
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. System parses Skyvera Excel budget file without errors and extracts all 140 customer records with financial metrics
  2. System routes all Claude API requests through centralized orchestration with queue-based rate limiting
  3. System provides consistent business metric definitions (ARR, EBITDA, Net Margin) through semantic layer
  4. System caches data with 15-minute TTL and returns cached responses for repeated queries
  5. System handles missing data gracefully (null values, missing Salesforce IDs) without crashes
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md -- Bootstrap Next.js project, TypeScript types, Zod schemas, Prisma/SQLite models
- [x] 01-02-PLAN.md -- Semantic layer (metric definitions, resolver, validator) and cache manager
- [x] 01-03-PLAN.md -- Claude API orchestrator with rate limiting, priority queue, prompt templates
- [x] 01-04-PLAN.md -- Excel adapter, NewsAPI adapter, connector factory, health endpoint

### Phase 2: Core Platform UI
**Goal**: Users can view enhanced financial dashboards and browse all 140 customer accounts with health indicators
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, ACCT-01, ACCT-02, ACCT-03
**Success Criteria** (what must be TRUE):
  1. User views enhanced financial KPI dashboard showing multi-BU breakdown (Cloudsense, Kandy, STL) with current vs target metrics
  2. User browses directory of all 140 customers with search and filter capabilities
  3. User sees account health score (red/yellow/green indicator) for each customer based on multiple data sources
  4. User views financial metrics per account (ARR, NRR, margin) with data freshness timestamps
  5. User receives proactive alerts dashboard showing at-risk accounts and metric anomalies
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- App shell (layout, navigation, shared UI components) and server-side data access functions
- [x] 02-02-PLAN.md -- Financial KPI dashboard with charts, BU breakdown, and metrics (DASH-01)
- [x] 02-03-PLAN.md -- Account directory with TanStack Table and proactive alerts dashboard (ACCT-01-03, DASH-02)

### Phase 3: Intelligence Features
**Goal**: Users can model what-if scenarios and ask natural language questions about business data
**Depends on**: Phase 1
**Requirements**: SCEN-01, SCEN-02, SCEN-03, SCEN-04, NLQ-01, NLQ-02, NLQ-03
**Success Criteria** (what must be TRUE):
  1. User models financial scenarios (pricing changes, cost adjustments) and sees validated impact calculations with bounds checking
  2. User models headcount scenarios (hiring plans) and customer scenarios (churn impact) with before/after metric comparisons
  3. User receives Claude-powered impact analysis for scenarios explaining financial implications
  4. User asks natural language questions from pre-programmed query library (5-10 canned queries)
  5. User asks free-form natural language questions and receives clarification dialogue for ambiguous queries
  6. User browses curated metrics catalog to build queries with semantic definitions
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md -- Scenario modeling: service layer (types, calculator, analyzer) + API route + UI forms and impact display (SCEN-01 through SCEN-04)
- [x] 03-02-PLAN.md -- Natural language query: canned queries, interpreter, clarification + API route + UI with metrics catalog (NLQ-01 through NLQ-03)

### Phase 4: Advanced Account Intelligence
**Goal**: Users can view comprehensive 7-tab account plans with real-time intelligence and competitive context
**Depends on**: Phase 2, Phase 3
**Requirements**: ACCT-04, ACCT-05, ACCT-06, ACCT-07, ACCT-08, ACCT-09, ACCT-10
**Success Criteria** (what must be TRUE):
  1. User navigates 7-tab account plan interface (Overview, Financials, Organization, Strategy, Competitive, Intelligence, Action Items)
  2. User views organization structure and stakeholder mapping per account with role definitions
  3. User tracks pain points and opportunities per account with status indicators
  4. User manages action plans per account with ownership and due dates
  5. User receives Claude-generated strategic insights for each account based on multi-source data
  6. User sees real-time news and intelligence for customer companies with sentiment analysis
  7. User views competitive intelligence showing competitors for us and for the customer
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md -- Account plan types (Zod schemas), data access layer, and mock data for 5 hero accounts
- [ ] 04-02-PLAN.md -- Account plan page shell, tab navigation, and 4 tabs (Overview, Financials, Strategy, Competitive)
- [ ] 04-03-PLAN.md -- Organization tab (org chart tree, stakeholder cards) and Intelligence tab (insights, news timeline)
- [ ] 04-04-PLAN.md -- Action Items tab with @dnd-kit Kanban board (drag-and-drop, quick-add)

### Phase 5: Demo Readiness
**Goal**: System is demo-ready with full end-to-end testing, error recovery, and performance optimization
**Depends on**: Phase 4
**Requirements**: (No new requirements - hardening existing features)
**Success Criteria** (what must be TRUE):
  1. System completes full end-to-end demo flow testing 3x without critical failures
  2. System handles API failures gracefully with cached fallback data and user-visible error messages
  3. System loads initial dashboard in under 2 seconds and transitions between views in under 500ms
  4. All 140 customer accounts have demo-ready data with realistic financial metrics and intelligence
  5. Manual refresh buttons are visible and functional in all views with loading indicators
**Plans**: TBD

Plans:
- [ ] 05-01: TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Integration | 4/4 | Complete ✓ | 2026-02-08 |
| 2. Core Platform UI | 3/3 | Complete ✓ | 2026-02-09 |
| 3. Intelligence Features | 2/2 | Complete ✓ | 2026-02-09 |
| 4. Advanced Account Intelligence | 0/4 | Planning complete | - |
| 5. Demo Readiness | 0/TBD | Not started | - |
