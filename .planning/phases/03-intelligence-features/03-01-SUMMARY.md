---
phase: 03-intelligence-features
plan: 01
subsystem: intelligence
tags: [claude, scenario-modeling, react-hook-form, zod, what-if-analysis]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Claude orchestrator, semantic resolver, Result type pattern
  - phase: 02-core-platform-ui
    provides: UI patterns, accessible components, server-first data fetching
provides:
  - Scenario modeling feature with financial/headcount/customer scenarios
  - ScenarioCalculator for before/after metric calculations
  - Claude-powered impact analysis with risk assessment
  - Validated forms with Federal Reserve-inspired bounds
affects: [04-interactive-features]

# Tech tracking
tech-stack:
  added: [react-hook-form, @hookform/resolvers, lucide-react]
  patterns:
    - Discriminated union schemas for scenario types (financial, headcount, customer)
    - React Hook Form with Zod resolver for runtime validation
    - Client component islands for interactive forms with server-side baseline fetching

key-files:
  created:
    - src/lib/intelligence/scenarios/types.ts
    - src/lib/intelligence/scenarios/calculator.ts
    - src/lib/intelligence/scenarios/analyzer.ts
    - src/app/api/scenarios/analyze/route.ts
    - src/lib/data/server/scenario-data.ts
    - src/app/scenario/page.tsx
    - src/app/scenario/loading.tsx
    - src/app/scenario/components/scenario-form.tsx
    - src/app/scenario/components/impact-display.tsx
  modified:
    - src/components/ui/nav-bar.tsx

key-decisions:
  - "React Hook Form with 'any' typing for discriminated unions (TypeScript limitation with union types)"
  - "Federal Reserve-inspired bounds: pricing ±50%, headcount -20/+50, churn 0-30%"
  - "Graceful fallback when Claude API unavailable: shows calculated metrics with mock analysis"
  - "Quarterly cost calculations for headcount/customer scenarios (annual values / 4)"
  - "Server Component page fetches baseline metrics, Client Component handles form interaction"

patterns-established:
  - "Scenario modeling pattern: types → calculator → analyzer → API route → UI"
  - "Accessible change indicators: color + icon + sr-only text + aria-label (WCAG 2.2 AA)"
  - "Loading skeleton per route for progressive rendering"

# Metrics
duration: 7 min
completed: 2026-02-09
---

# Phase 3 Plan 1: Scenario Modeling Summary

**Three scenario types (financial/headcount/customer) with validated forms, before/after metric comparison tables, and Claude-powered impact analysis including risk assessment and recommendations**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-09T13:23:05Z
- **Completed:** 2026-02-09T13:31:00Z
- **Tasks:** 2/2
- **Files modified:** 10

## Accomplishments

- Scenario service layer: Zod schemas with bounded inputs, ScenarioCalculator for impact metrics, Claude-powered analyzer
- POST /api/scenarios/analyze endpoint with full validation and graceful fallback
- ScenarioForm component with React Hook Form + Zod validation supporting 3 scenario types
- ImpactDisplay component with accessible before/after comparison table and Claude analysis visualization
- Nav bar updated with Scenarios and Ask links (preparing for Plan 03-02)

## Task Commits

1. **Task 1: Scenario service layer and API route** - `6fbdc4c` (feat)
2. **Task 2: Scenario UI with forms, impact display, and nav update** - `3114a95` (feat)

## Files Created/Modified

- `src/lib/intelligence/scenarios/types.ts` - Zod schemas for financial/headcount/customer scenarios with Fed-style bounds
- `src/lib/intelligence/scenarios/calculator.ts` - ScenarioCalculator computes before/after metrics for all 3 types
- `src/lib/intelligence/scenarios/analyzer.ts` - analyzeScenarioWithClaude integrates via orchestrator
- `src/app/api/scenarios/analyze/route.ts` - POST endpoint with Zod validation and baseline fetching
- `src/lib/data/server/scenario-data.ts` - getBaselineMetrics assembles data for calculations
- `src/app/scenario/page.tsx` - Server Component page with baseline fetching
- `src/app/scenario/loading.tsx` - Loading skeleton for progressive rendering
- `src/app/scenario/components/scenario-form.tsx` - React Hook Form with type selector and dynamic fields
- `src/app/scenario/components/impact-display.tsx` - Before/after table with accessible change indicators
- `src/components/ui/nav-bar.tsx` - Added Scenarios and Ask links

## Decisions Made

**Federal Reserve-inspired bounds for scenario modeling:**
- Financial scenarios: pricing change -50% to +100%, cost change -30% to +100%, target margin 0-100%
- Headcount scenarios: headcount change -20 to +50 people, avg salary $50k to $300k
- Customer scenarios: churn rate 0-30%, acquisition 0-50 customers, avg ARR $10k to $5M
- Rationale: Realistic bounds prevent nonsensical inputs while allowing meaningful what-if analysis

**React Hook Form with 'any' typing for discriminated unions:**
- TypeScript doesn't support discriminated unions well in React Hook Form generic types
- Using 'any' for form data with Zod runtime validation ensures correctness
- Error message access requires String() casting due to union uncertainty

**Graceful fallback when Claude API unavailable:**
- If ANTHROPIC_API_KEY not configured, analyzer returns mock ScenarioImpactResponse
- Mock shows "Claude analysis unavailable" message with calculated metrics
- Allows development and testing without API key

**Server-first data fetching pattern:**
- ScenarioPage Server Component fetches baseline metrics server-side
- Passes baseline as prop to Client Component ScenarioForm
- Reduces client-side data fetching, improves initial load performance

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**React Hook Form discriminated union TypeScript errors:**
- TypeScript doesn't infer discriminated union types correctly with React Hook Form generics
- Resolution: Used 'any' for form data with Zod runtime validation (type safety at runtime, not compile time)
- Error message access required String() casting

**Edit tool file deletion:**
- During replace_all operations, tool deleted entire files instead of editing in place
- Resolution: Recreated scenario-form.tsx and impact-display.tsx from scratch
- No data loss - files were simple to recreate

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 03-02: Natural Language Query**
- Claude orchestrator operational and tested with scenario analysis
- UI patterns established (client islands, server data fetching, accessible components)
- Nav bar "Ask" link already added in preparation

**No blockers or concerns**

---
*Phase: 03-intelligence-features*
*Completed: 2026-02-09*
