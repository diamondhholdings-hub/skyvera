---
phase: 04-advanced-account-intelligence
plan: 02
status: complete
subsystem: ui
tags: [account-plans, tabs, next.js, server-components, responsive, wcag]

dependencies:
  requires:
    - 04-01-account-plan-data-layer
    - 02-03-account-directory
  provides:
    - account-plan-page-shell
    - tab-navigation-pattern
    - overview-financials-strategy-competitive-tabs
  affects:
    - 04-03-organization-ui
    - 04-04-intelligence-ui

tech:
  stack:
    added: []
    patterns:
      - url-based-tab-navigation
      - suspense-per-tab-pattern
      - responsive-tab-dropdown
      - wcag-color-icon-text-badges

files:
  created:
    - src/app/accounts/[name]/page.tsx
    - src/app/accounts/[name]/loading.tsx
    - src/app/accounts/[name]/_components/tab-navigation.tsx
    - src/app/accounts/[name]/_components/overview-tab.tsx
    - src/app/accounts/[name]/_components/financials-tab.tsx
    - src/app/accounts/[name]/_components/strategy-tab.tsx
    - src/app/accounts/[name]/_components/competitive-tab.tsx
  modified:
    - src/app/accounts/components/account-table.tsx

decisions:
  - title: URL-based tab state with searchParams
    rationale: Tabs persisted in URL enable bookmarking/sharing specific views
    alternatives: [client-only state, URL hash, separate routes per tab]
    chosen: searchParams
    impact: Users can link directly to specific tabs (e.g., ?tab=strategy)

  - title: Responsive tab pattern (horizontal bar vs dropdown)
    rationale: Desktop has space for horizontal tabs, mobile needs compact dropdown
    alternatives: [always horizontal with scroll, always dropdown, hamburger menu]
    chosen: CSS media query breakpoint (md:)
    impact: Optimal UX for both desktop and mobile viewports

  - title: Suspense boundary per tab
    rationale: Independent loading states prevent whole-page blocking if one tab is slow
    alternatives: [page-level Suspense, no Suspense, nested Suspense per section]
    chosen: tab-level Suspense
    impact: Progressive rendering - fast tabs appear immediately

metrics:
  duration: 4min
  completed: 2026-02-09
---

# Phase 04 Plan 02: Account Plan Page Shell Summary

**7-tab account plan page with URL-persisted navigation, clickable account directory links, and 4 fully functional tabs (Overview, Financials, Strategy, Competitive) using server components and WCAG-compliant badge patterns**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T14:58:00Z
- **Completed:** 2026-02-09T15:02:24Z
- **Tasks:** 2
- **Files modified:** 8 (7 created, 1 modified)

## Accomplishments

- Users can navigate from account directory to individual account plans via clickable customer names
- 7-tab interface with URL-persisted state (bookmarkable/shareable links)
- 4 functional tabs: Overview (KPIs + health + intelligence), Financials (revenue + subscriptions), Strategy (pain points + opportunities), Competitive (dual-perspective competitor analysis)
- Responsive navigation: horizontal tabs on desktop, dropdown on mobile
- WCAG 2.2 Level AA compliance: all status badges use color + icon + text (never color alone)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create account plan page with tab navigation and link from account table** - `e3a4c35` (feat)
2. **Task 2: Build Overview, Financials, Strategy, and Competitive tab content** - `eb91c28` (feat)

## Files Created/Modified

**Created:**
- `src/app/accounts/[name]/page.tsx` - Server Component account plan page with 7-tab conditional rendering, fetches account data + customer financials
- `src/app/accounts/[name]/loading.tsx` - Animated skeleton matching page layout
- `src/app/accounts/[name]/_components/tab-navigation.tsx` - Client Component tab UI with useSearchParams, horizontal bar (desktop) / dropdown (mobile)
- `src/app/accounts/[name]/_components/overview-tab.tsx` - KPI cards (ARR, revenue, health, subs), account summary, intelligence snippet, health factors list
- `src/app/accounts/[name]/_components/financials-tab.tsx` - Revenue KPIs, subscription table with renewal badges, revenue breakdown stacked bar chart
- `src/app/accounts/[name]/_components/strategy-tab.tsx` - Two-column grid with pain points (severity/status badges) and opportunities (value/probability)
- `src/app/accounts/[name]/_components/competitive-tab.tsx` - Dual perspective competitor cards (Skyvera competitors vs customer's market rivals) with strengths/weaknesses

**Modified:**
- `src/app/accounts/components/account-table.tsx` - Customer names now Link components pointing to /accounts/[encoded-name]

## Decisions Made

**1. URL-based tab navigation with searchParams**
- Tabs controlled by `?tab=overview` query parameter in URL
- Enables bookmarking specific tabs and sharing links to Strategy or Competitive views
- Next.js 16 pattern: `searchParams` is a Promise, awaited in server component
- Alternative: client-only state would prevent bookmarking
- Chosen for shareability and browser back/forward button support

**2. Responsive tab pattern**
- Desktop (md+ breakpoint): Horizontal tab bar with active state (border-b-2)
- Mobile (below md): Dropdown `<select>` for space efficiency
- Alternative: Always horizontal with scroll would have poor mobile UX
- Alternative: Always dropdown would waste desktop space
- Chosen CSS media query breakpoint provides optimal experience for both

**3. Suspense boundary per tab**
- Each tab wrapped in `<Suspense fallback={<TabSkeleton />}>`
- Prevents one slow tab from blocking entire page render
- Alternative: Page-level Suspense would show skeleton for whole page
- Chosen for progressive rendering - fast tabs appear immediately

**4. WCAG 2.2 Level AA badge patterns**
- All status indicators use color + icon + text (never color alone)
- Severity badges: 🔴/🟡/🟢 + High/Medium/Low text
- Renewal badges: ✓/✕/? icons + Yes/No/TBD text + color-coded backgrounds
- Opportunity status: 🔍/🔬/📋/✓/✕ icons + text labels
- Ensures accessibility for colorblind users

**5. Nullable field handling for subscription data**
- Excel data has nullable fields: `renewal_qtr`, `arr`, `projected_arr`
- Display "N/A" for null values instead of crashing
- Alternative: Skip rows with null values would hide valid data
- Chosen for data completeness and graceful degradation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. TypeScript errors with nullable subscription fields**
- **Issue:** Initial implementation assumed subscription fields non-null, but Excel schema has `arr`, `projected_arr` as `number | null`
- **Resolution:** Added null checks with ternary operators displaying "N/A" for missing values
- **Files:** financials-tab.tsx line 66-73
- **Impact:** Fixed during development, no runtime errors

**2. Field name mismatch: renewal_quarter vs renewal_qtr**
- **Issue:** Initial code used `renewal_quarter` but Excel schema field is `renewal_qtr`
- **Resolution:** Corrected field name to match schema
- **Files:** financials-tab.tsx line 68
- **Impact:** Fixed during TypeScript compilation check

## Next Phase Readiness

**Ready for 04-03 (Organization UI):**
- Account plan page shell complete with tab navigation
- Organization tab placeholder already rendered with "Coming soon" message
- Data layer from 04-01 has stakeholder data ready for org chart visualization

**Ready for 04-04 (Intelligence UI):**
- Intelligence and Action Items tabs have placeholders
- getIntelligenceReport() returns raw markdown ready for structured parsing
- Overview tab shows intelligence snippet - full report tab can expand on this

**Blockers:** None

**Concerns:** None - all tabs render correctly for hero accounts with data and show graceful empty states for accounts without mock data

## Files Changed

**Total lines added:** 1,021 (7 new files)

**Key patterns:**
- Next.js 16 async params/searchParams: `const { name } = await params`
- Server Component data fetching: Direct calls to getAccountPlanData() and getAllCustomersWithHealth()
- Client Component islands: TabNavigation uses client hooks, all tab content is server-rendered
- Suspense per route section: Each tab independently suspends during data loading

---
*Phase: 04-advanced-account-intelligence*
*Completed: 2026-02-09*
