# Changelog

All notable changes to the Skyvera Intelligence Platform.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Pending (PR #2 — fix/pr-review-hardening → main)
- WCAG 2.2 hardening and Zod v4 migration (see v1.4.0 below — awaiting merge)

---

## [1.4.0] - 2026-05-08

### Fixed
- **ARIA / WCAG 2.2 hardening** (beads issue skyvera-9at — 47 findings):
  - Tab navigation converted from `<button>` to `<Link href>` + `aria-current="page"` across dashboard and account detail pages
  - `<nav aria-label="Account sections">` wrapping all tab bars
  - Chat panel upgraded to `role="dialog" aria-modal="true"` with full focus trap and Escape key dismiss
  - Filter groups converted to `<fieldset><legend>` for proper group semantics
  - Tables given descriptive `aria-label` attributes
  - Search inputs typed as `type="search"`
  - `prefers-reduced-motion` media query guard added to all CSS animations
  - `scroll-margin-top: 80px` on all anchor targets to clear sticky nav
  - All decorative emoji wrapped in `<span aria-hidden="true">`
  - Hardcoded hex color values replaced with CSS custom property tokens throughout
- **Zod v4 migration** — resolved 24 pre-existing TypeScript compiler errors:
  - `z.record(z.string(), z.unknown())` corrected to two-argument form
  - `errorMap` parameter renamed to `error` per Zod v4 API
  - 21 `ScenarioInput` test fixtures updated with required `affectedBU: 'All'` field
  - `tsc` now exits at 0 errors (was 24)

### Added
- `PRODUCT.md` — product register documenting Editorial Datafeed design language and feature inventory
- `DESIGN.md` — design system reference: brick-red `#C84B31` primary, CSS token vars, typography scale
- Beads issue tracker (`bd init`) — 3 issues filed: skyvera-prf (DM accept handler), skyvera-iph (BU row navigation), skyvera-0yu (wire financial metrics)

---

## [1.3.0] - 2026-04-06

### Added
- **CI/CD pipeline** — `.github/workflows/ci.yml` runs type-check + build + Playwright smoke tests on every PR
- **Rate limiting** — in-memory per-IP sliding window on all 9 Claude-calling API routes (10–20 req/min); enrichment routes 5 req/min; returns `429` + `{ error, retryAfter }`
- **Zod input validation** — schemas at all API entry points (`src/lib/validation/schemas.ts`); returns `400` + `issues` array on failure
- **OpenCorporates integration** — new adapter for corporate registry (directors, legal name, jurisdiction); graceful degraded mode when key absent
- **Error boundaries** — `src/components/ui/error-boundary.tsx` + 3 high-risk client components wrapped
- **RapidAPI degraded mode** — missing `RAPIDAPI_KEY` returns `ok({ data: [] })` not `err()`; pipeline marks sections `skipped` not `error`
- **OpenCorporates degraded mode** — same graceful-skip pattern as RapidAPI
- **`healthCheck()`** on all external adapters returns `!this.degraded` (not hardcoded `true`)
- **Bulk enrichment script** — `npm run enrich:accounts` enriches all 140 accounts (~19 min); supports `--limit` and `--bu` flags
- **Unit test suite** — 161/161 Vitest tests across 9 files covering business logic, adapters, middleware
- **Smoke test suite** — 49/49 Playwright tests across 6 files (+15 new tests, +10 selector fixes)

### Changed
- Enrichment error handling: distinguishes `ENOENT` (return null) from real errors (log + return null)
- Cache manager extended with `DEMO_MODE` flag — extends TTLs to 30 min (vs 5 min default)

### Fixed
- `healthCheck()` returning hardcoded `true` on all adapters — now reflects actual degraded state

---

## [1.3.1] - 2026-04-06 (data)

### Added
- **Full 140-account enrichment** — all accounts enriched via RapidAPI (5 adapters) + OpenCorporates; results written to `data/enrichment/{slug}.json`

---

## [1.2.0] - 2026-03-10

### Added
- **8-tab account detail pages** (`/accounts/[name]`) — Overview, Organization, Strategy, Actions (Kanban), Intelligence, Financials, News, Stakeholders
- **AI chat per account** — streaming Claude panel in account detail; conversation context tracking
- **PDF / print export** — `@media print` hides `[data-print="hide"]` elements; A4 layout; `-webkit-print-color-adjust: exact`
- **Inline status editing** — `StatusCycleButton` with optimistic update → PATCH → revert on error
- **Account search** — URL-driven (`?search=`) with server-side filtering; bookmarkable
- **Data completeness scoring** — 7-dimension 0–100 badge on accounts page
- **URL-based tab state** — `?tab=overview` makes account detail tabs bookmarkable and shareable
- **Drag-and-drop Kanban** — `@dnd-kit` for action items; closestCorners collision; DragOverlay preview
- **Stakeholder org chart** — indented tree view with CSS borders; RACI roles; relationship strength indicators
- **Unified design system** — shared `PageHeader` component; CSS custom properties (`--ink`, `--paper`, `--accent`, `--secondary`, `--muted`, `--border`, `--highlight`, `--success`, `--warning`, `--critical`); Cormorant Garamond display font; editorial palette replacing generic Tailwind color classes

### Fixed
- 14 PR review issues resolved in `eda6b2a`

---

## [1.1.0] - 2026-02-12

### Added
- **Scenario calculator** (`/scenario`) — pricing ±50%, headcount -20/+50%, churn 0–30% sliders; Federal Reserve-inspired bounds; graceful fallback when Claude unavailable
- **Natural language query** (`/query`) — 7 canned queries across 4 categories; multi-turn conversation context; clarification dialog with amber highlighting; metrics catalog
- **Account intelligence** — OSINT reports per account (`data/intelligence/`); fuzzy file matching for naming variations; parallel data aggregation via `Promise.all`
- **DM strategy engine** — `/dm-strategy` page; recommendation generation per account
- **Alerts page** — severity-sorted (red before yellow); relative timestamps via `date-fns`

### Changed
- `ClaudeOrchestrator` singleton handles all Claude API calls — 50 RPM token bucket, priority queue (HIGH/MEDIUM/LOW), response caching (5 min HIGH, 15 min MEDIUM/LOW), exponential backoff (max 3 retries)
- SemanticResolver extended with full financial metric catalog (ARR, EBITDA, NRR, DM%, margins)

---

## [1.0.0] - 2026-02-08

### Added
- **Foundation** — Next.js 16 + TypeScript + Tailwind + Prisma (SQLite) project scaffold
- **Data layer** — Excel adapter (openpyxl Python bridge); parses 140 customers across Cloudsense, Kandy, STL, NewNet BUs from `2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx`
- **Semantic layer** — `SemanticResolver` as single source of truth for all metric calculations; `arr: customer.rr` alias (values already annual)
- **Claude orchestrator** — `ClaudeOrchestrator` singleton; djb2 cache key hashing; all prompts request JSON output with confidence levels and source citations
- **Result type pattern** — `src/lib/types/result.ts`; no thrown exceptions at data boundaries
- **Cache manager** — in-memory Map; TTLs: 5 min financial, 10 min customer, 15 min news/enrichment; ±10% jitter
- **Dashboard** (`/`) — gradient header; KPI cards; BU breakdown table; revenue trend chart; alerts panel; Suspense per section for progressive rendering
- **Accounts directory** (`/accounts`) — TanStack Table v8; card grid layout; health scoring (green/yellow/red); URL-driven search
- **Customer health scoring** — green (stable), yellow (some concerns), red (at-risk)
- **Prisma schema** — `Customer`, `Subscription`, `DMRecommendation` models
- **NewsAPI adapter** — degraded mode when key absent (returns empty, does not fail)
- **Health endpoint** — returns 200 even if some adapters degraded
- **Loading skeletons** — `loading.tsx` per route; animate-pulse with editorial border color
- **WCAG 2.2 Level AA baseline** — color + icon + text for all health/status indicators (never color alone)
- **`NEXT_PUBLIC_APP_URL`** env var — required for Playwright test base URL resolution
