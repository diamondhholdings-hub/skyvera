# WAITING_ON.md — Skyvera Intelligence Platform

> Blockers and external dependencies that require human action before work can continue.
> Last updated: 2026-08-05

---

## 🔴 Blocking — Cannot proceed without these

None currently.

---

## 🟡 Pending Human Action

None currently — the npm audit item below was resolved same-session.

---

## 🟢 No Blocker — Ready to build when prioritized

### 1. Authentication system
**Status:** On hold by design. Revisit when platform is ready for broader access.

### 2. Supabase (PostgreSQL) migration
**Decision:** Use Supabase — already in use on other Vercel projects.
**Reason:** SQLite has write concurrency issues in production (Vercel serverless).
**Next:** Connect Supabase project, update DATABASE_URL, run `prisma db push`, re-seed.
**Action needed:** Provide Supabase connection string or link the project via Vercel Supabase integration.

### 3. Sentry error monitoring
**What:** Add Sentry DSN to env vars and instrument error tracking.
**Effort:** ~1 hour.

---

## 🔧 Open Beads Issues

None currently — 0 open beads issues remain.

---

## ✅ Recently Resolved

| Date | Item | Resolution |
|------|------|------------|
| 2026-08-05 | Mobile responsiveness audit | Audited every main page at 390px in a real browser (checking actual `scrollLeft`, not just screenshots). Fixed 169px of real overflow on the dashboard (unwrapped nav icon row + 7 raw `<table>` elements); found a real bug where an inline `display: 'flex'` was defeating a `hidden lg:flex` Tailwind class so the "Live" indicator never hid on mobile; added `overflow-x: hidden` on `html`/`body` as a backstop. Verified zero horizontal scroll on dashboard, accounts, account detail, dm-strategy, scenario, query, alerts. |
| 2026-08-05 | Repo hygiene — 21 superseded root markdown files | Moved (not deleted — `git mv`, fully reversible) one-off build-completion summaries (HANDOFF.md, TODO.md, DM pipeline/OSINT/account-generation docs, etc.) to `docs/archive/`. `.git` size (~196MB) and the untracked tooling dirs (`.agents/`, `.cortex/`, `.claude/skills/`) are still outstanding — both need Todd's input, not autonomous. |
| 2026-08-05 | CSV data export | `GET /api/export/accounts` (rate limited) + download button on the accounts page. |
| 2026-08-05 | DM Tracker silently serving stale data in production | `getDMTrackerData()` shelled out to `python3`/`openpyxl` at request time, which doesn't exist on Vercel, so every production request silently fell back to a hardcoded March 2026 snapshot. Now reads a pre-built `src/data/dm-tracker-snapshot.json` first, same pattern as the main Excel adapter — Python bridge is now local-dev-only, static snapshot is the last-last resort. |
| 2026-08-05 | npm audit — 14 vulnerabilities, 1 critical, 11 high | All resolved via `npm audit fix` — in-range patch/minor bumps to transitive dependencies, no `package.json` changes, no semver-major bumps. 0 vulnerabilities remain. |
| 2026-08-05 | `/api/health` info disclosure, rate limiter IP-spoofing, `aggregateByBU` dead code | `/api/health` no longer discloses per-adapter status or which integration keys are configured to unauthenticated callers. Rate limiter now trusts Vercel-set `request.ip`/`x-real-ip` over the client-controllable first entry of `X-Forwarded-For`. `aggregateByBU()` was dead code that always returned an empty map (byBU was declared but never populated) — now actually groups and aggregates by BU, with a new test proving it. |
| 2026-08-05 | Adversarial review findings — SOQL injection, unauthenticated data-wipe, missing rate limiting | A same-session adversarial security + code review (2 findings sets, both adversarially verified) surfaced a confirmed SOQL injection in `src/lib/salesforce/sync.ts`, an unauthenticated `/api/seed` endpoint that wiped all Customer/Subscription data, and 5 routes missing rate limiting/Zod validation. All fixed same-session: backslash-safe SOQL escaping, `/api/seed` env-gated to non-production, `rateLimit()` + Zod added to `/api/salesforce/sync/[accountName]`, `/api/scenarios/conversation/[id]/{refine,compare}`, `/api/product-agent/generate-prd`, and `/api/dm-strategy/{accept,defer}-recommendation`. Also fixed 2 dormant recurrences of the earlier double-counting/merge-order bug class (`ExcelAdapter.getStats()`, `DataValidator.reconcile()`) and a live DM% weighting bug on `/dm-strategy`. See `SYSTEM_REVIEW_2026-08-05.md` and `NEXT_PRIORITIES.md` for full detail. |
| 2026-08-05 | Repo hygiene — 100+ stray duplicate files | Removed all `' 2'`-suffixed duplicate source/data/config files and 4 empty stray directories found during the adversarial review, after confirming each was untracked and byte-identical (or empty) versus its original. |
| 2026-08-05 | PR #2 — WCAG 2.2 hardening, Zod v4 migration, test fixes | Merged to `main` in commit `efc01d0` (PR #2, `fix/pr-review-hardening`); 161/161 unit tests, 49/49 smoke tests pass, tsc 0 errors, CI green |
| 2026-08-05 | skyvera-0yu — Wire hardcoded financial metrics (P2) | Real Q3'26 figures wired from Excel: per-BU Prior Plan RR/revenue, per-BU real Margin Target, AR > 90 days total, YoY revenue change / Rule of 40 — replacing hardcoded literals |
| 2026-08-05 | skyvera-prf — DM briefing accept handler (P3) | "Accept" button wired with optimistic update + toast, calling `POST /api/dm-strategy/accept-recommendation` (actionItem payload optional for quick-accept) |
| 2026-08-05 | skyvera-iph — BU table row navigation (P3) | BU performance table rows now link to `/accounts?bu=<name>`; accounts page now reads the `bu` searchParam it had declared but never used |
| 2026-08-05 | CI-blocking lockfile drift | `package-lock.json` had drifted from `package.json`, breaking `npm ci` locally and in GitHub Actions — resynced |
| 2026-08-05 | Dashboard double-counting bug | `getDashboardData()` was summing the consolidated 'Skyvera' P&L entry with the three per-BU entries it already contains, ~doubling every headline KPI (revenue, RR, EBITDA); now sourced directly from the consolidated entry, and `getBUSummaries()` excludes the phantom 4th "BU" row |
| 2026-05-08 | RapidAPI enrichment for all 140 accounts | Full run complete — all 140 accounts enriched via RapidAPI + OpenCorporates, written to `data/enrichment/` |
| 2026-05-08 | WCAG 2.2 / ARIA hardening (skyvera-9at) | 47 findings fixed: ARIA tabs, focus trap, fieldset/legend, reduced-motion, scroll-margin-top, emoji aria-hidden |
| 2026-05-08 | Zod v4 migration + tsc 0 errors | 24 pre-existing TypeScript errors resolved; `errorMap`→`error`, `z.record` signature, 21 test fixtures updated |
| 2026-05-08 | Design system (PRODUCT.md + DESIGN.md) | Editorial Datafeed register documented; brick-red `#C84B31` primary, CSS token vars throughout |
| 2026-05-08 | Beads issue tracker initialized | `bd init` complete; 3 new issues filed (skyvera-prf, skyvera-iph, skyvera-0yu) |
| 2026-04-06 | RAPIDAPI_KEY added to Vercel + .env.local | Enrichment pipeline live |
| 2026-04-06 | OPENCORPORATES_API_KEY | Added to Vercel + .env.local — fully configured |
| 2026-04-06 | ANTHROPIC_API_KEY | Added to Vercel development env + .env.local |
| 2026-04-06 | Session work commit | All work committed as `55c6a30`, pushed to `origin/main` |
| 2026-04-06 | CI/CD pipeline | `.github/workflows/ci.yml` — type-check + build + smoke tests on every PR |
| 2026-04-06 | Rate limiting | In-memory per-IP rate limiter on all 9 Claude-calling routes |
| 2026-04-06 | Input validation | Zod schemas at all API entry points |
| 2026-04-06 | RapidAPI degraded mode | Missing key now returns `skipped` not `error` for all 5 adapters |
| 2026-04-06 | OpenCorporates integration | New adapter + enrichment pipeline + type extension |
| 2026-04-06 | Error boundaries | `error-boundary.tsx` + 3 high-risk components wrapped |
| 2026-04-06 | Unit test suite | Vitest — 161/161 passing across 9 test files |
| 2026-04-06 | Smoke tests expanded | Playwright — 49/49 passing (+15 new, +10 selector fixes) |
| 2026-04-06 | All docs updated | README, TODO, SESSION_SUMMARY, tests/README, docs/INDEX, docs/architecture |
| 2026-04-06 | fix/pr-review-hardening | Already on origin/main (was pushed directly) |
| 2026-03-10 | 14 PR review issues | Fixed in `eda6b2a` |
| 2026-03-10 | Export/PDF functionality | Implemented via `@media print` |
| 2026-03-10 | Inline status editing | StatusCycleButton + PATCH API routes |
| 2026-03-10 | Account search | URL-driven with server-side filtering |
| 2026-03-10 | Data completeness scoring | 7-dimension 0-100 badge on accounts page |
| 2026-03-10 | AI chat per account | Streaming Claude panel in account detail |
