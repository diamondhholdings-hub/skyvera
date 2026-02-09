# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** Executives and BU leaders can instantly understand business performance, customer health, and scenario impacts through AI-powered intelligence and natural language interaction - eliminating manual data gathering and enabling rapid strategic decision-making
**Current focus:** Phase 4: Advanced Account Intelligence

## Current Position

Phase: 4 of 5 (Advanced Account Intelligence)
Plan: 1 of TBD in current phase
Status: In progress
Last activity: 2026-02-09 - Completed 04-01-PLAN.md (account plan data layer)

Progress: [██████░░░░] 62%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 5.2 min
- Total execution time: 0.86 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 - Foundation & Data Integration | 4 | 21min | 5.3min |
| 2 - Core Platform UI | 3 | 13.9min | 4.6min |
| 3 - Intelligence Features | 2 | 13min | 6.5min |
| 4 - Advanced Account Intelligence | 1 | 6min | 6min |

**Recent Trend:**
- Last 5 plans: 02-03 (4.6min), 03-01 (7min), 03-02 (6min), 04-01 (6min)
- Trend: Stable (6.2min avg recent)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 24-hour demo timeline: Speed is critical for business needs, drives aggressive compression and parallelization strategy
- Claude-powered intelligence: All AI requests flow through centralized orchestration layer for consistency and rate limiting
- Foundation-first approach: Research shows semantic layer and Claude orchestrator must exist before any user-facing features

**From Plan 01-01 (2026-02-09):**
- Result type pattern for explicit error handling at all data boundaries (no throwing exceptions)
- Zod schemas as single source of truth for runtime validation and TypeScript types
- Prisma 7 config approach (datasource URL in prisma.config.ts, not schema)
- API keys optional in env validation to allow development without external services
- BUEnum includes NewNet (exists in data/) even though not in primary BU list

**From Plan 01-02 (2026-02-09):**
- DataProvider interface pattern enables pluggable data sources (MockDataProvider now, adapters in Plan 04)
- In-memory Map for cache storage (Redis swappable via interface post-demo)
- Cache TTL: 5min financial, 10min customer, 15min news/enrichment with ±10% jitter
- SemanticResolver as single source of truth for all metric calculations
- Customer health scoring: green (stable), yellow (some concerns), red (at-risk)

**From Plan 01-03 (2026-02-09):**
- All Claude API requests MUST flow through ClaudeOrchestrator singleton (no direct SDK calls)
- Rate limiter enforces 50 RPM with token bucket and even distribution
- Priority queue: HIGH (user-facing) processes before MEDIUM/LOW (background)
- Response caching with priority-based TTL (HIGH=5min, MEDIUM/LOW=15min)
- djb2 hash for cache keys (fast, sufficient for prompt deduplication)
- Max 3 retries on 429 errors with exponential backoff (1-2s base, doubles)
- All prompts specify JSON output with confidence levels and source citations

**From Plan 01-04 (2026-02-09):**
- DataAdapter interface enables pluggable data sources (Excel now, Salesforce/APIs later)
- Python bridge for Excel parsing reuses existing openpyxl logic, outputs JSON to stdout
- Parse Excel once at adapter connect(), serve from in-memory Maps for performance
- Validation failures logged but don't crash adapter (graceful coercion for minor issues)
- NewsAPI adapter runs in degraded mode if API key missing (not failed - allows dev without key)
- ConnectorFactory initializes adapters in parallel, handles individual adapter failures gracefully
- Health endpoint returns 200 even if some adapters degraded (system still partially functional)

**From Plan 02-01 (2026-02-09):**
- Server-first data fetching: Dashboard pages call data functions directly (no API routes needed)
- CustomerWithHealth extended with `bu` field: Each customer annotated with BU during data assembly for downstream filtering
- Client component islands: NavBar and RefreshButton only client components, rest server-rendered
- WCAG 2.2 Level AA accessibility: HealthIndicator uses color + icon + text + aria-label (never color alone)
- Loading.tsx per route: Instant feedback during navigation with Tailwind animate-pulse skeletons

**From Plan 02-02 (2026-02-09):**
- Server wrapper pattern for charts: Async Server Components fetch data and pass as props to "use client" chart components (keeps data fetching server-side)
- Suspense per section: Independent Suspense boundaries for KPIs, charts, BU breakdown, alerts enable progressive rendering
- Color-coded margin indicators: Green if >= target, red if below + checkmark/X icons for accessibility (never color alone)

**From Plan 02-03 (2026-02-09):**
- TanStack Table v8 for sortable/filterable customer table (handles 140 customers with sorting, filtering, global search)
- 300ms debounce on search input to prevent excessive re-renders
- Client component islands: AccountTable and AccountFilters are client components, page remains server component
- Alert severity sorting: red alerts before yellow, within same severity sort by impact value
- Relative timestamps with date-fns formatDistanceToNow for alert recency

**From Plan 03-01 (2026-02-09):**
- React Hook Form with 'any' typing for discriminated unions (TypeScript limitation with union types)
- Federal Reserve-inspired bounds: pricing ±50%, headcount -20/+50, churn 0-30%
- Graceful fallback when Claude API unavailable: shows calculated metrics with mock analysis
- Quarterly cost calculations for headcount/customer scenarios (annual values / 4)
- Server Component page fetches baseline metrics, Client Component handles form interaction

**From Plan 03-02 (2026-02-09):**
- 7 canned queries across 4 categories (performance, customers, financials, comparisons) with template expansion
- Conversation context tracking for multi-turn query refinement
- Clarification dialog with amber highlighting for ambiguous queries
- MetricDefinition serialization: strip calculate function before passing to client (Next.js limitation)
- Metrics catalog collapsible by default to avoid visual overload

**From Plan 04-01 (2026-02-09):**
- Graceful degradation for account plan data: missing files return empty arrays instead of errors (no crashes)
- Fuzzy file matching for intelligence reports: handles underscores, abbreviations, naming variations
- Parallel data aggregation: getAccountPlanData fetches 6 data sources with Promise.all for performance
- Stakeholder org hierarchy: reportsTo field enables tree building in UI
- RACI roles for stakeholder matrix visualization
- Mock data for 5 hero accounts: British Telecommunications, Liquid Telecom, Telefonica UK, Spotify, AT&T Services

### Pending Todos

None yet.

### Blockers/Concerns

**From Phase 1 Planning:**
- ✓ RESOLVED: Actual Skyvera data tested - Excel parser handles all 140 customers across 4 BUs without errors
- ✓ RESOLVED: NewsAPI.ai free tier validated - 100 req/day sufficient for demo (20-30 customers viewed)
- Salesforce API quota unknown until inspection - defer to Phase 2 if needed
- Claude API performance with production data volume unknown - test with production-scale prompts in Phase 2

**Architecture Dependencies:**
- ✓ RESOLVED: Phase 1 semantic layer interface defined - Phase 2 and 3 can proceed in parallel
- ✓ RESOLVED: Phase 2 UI components and Phase 3 intelligence features complete - Phase 4 can proceed

## Session Continuity

Last session: 2026-02-09 (plan execution)
Stopped at: Completed 04-01-PLAN.md - Account plan data layer with Zod schemas, data access functions, and 20 mock JSON files for 5 hero accounts
Resume file: None

**Phase 4 Progress - Account plan data layer complete. Ready for 04-02 (Stakeholder UI), 04-03 (Strategy UI), 04-04 (Intelligence UI). All consume types and data from 04-01.**
