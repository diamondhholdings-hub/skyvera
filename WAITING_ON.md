# WAITING_ON.md — Skyvera Intelligence Platform

> Blockers and external dependencies that require human action before work can continue.
> Last updated: 2026-04-06

---

## 🔴 Blocking — Cannot proceed without these

None currently.

---

## 🟡 Pending Human Action

### 1. Commit & push agent session work → main
**What:** Parallel agents this session produced uncommitted changes across the codebase.
Work in progress — 3 of 6 agents still running (api-hardening, unit-tests, e2e-tests).
**Once agents complete:** Stage and commit all changes, push to main, Vercel auto-deploys.
**Files changed (so far):**
- `.github/workflows/ci.yml` — GitHub Actions CI (new)
- `src/components/ui/error-boundary.tsx` — React ErrorBoundary component (new)
- `src/lib/middleware/rate-limit.ts` — In-memory rate limiter (new, in progress)
- `src/lib/validation/schemas.ts` — Zod input schemas (new, in progress)
- `src/lib/intelligence/`, `src/lib/cache/`, `src/lib/data/`, `src/lib/semantic/` — JSDoc added
- `src/app/accounts/[name]/_components/action-plan-tab.tsx` — ErrorBoundary wrapped
- `src/app/accounts/[name]/_components/pain-points-tab.tsx` — ErrorBoundary wrapped
- `src/app/accounts/[name]/page.tsx` — ErrorBoundary wrapped around chat panel
- `src/app/api/` — Rate limiting + Zod validation added (in progress)
- `tests/unit/` — New Vitest unit tests (in progress)
- `tests/smoke/`, `tests/e2e/` — Expanded Playwright tests (in progress)
- `vitest.config.ts` — Vitest setup (new)

### 2. RapidAPI Key (for live enrichment)
**What:** The 5 RapidAPI enrichment adapters are wired up but need a valid API key to run live.
**Where to set:** `.env.local` → `RAPIDAPI_KEY=<your-key>`
**Status:** Pre-cached enrichment data exists in `data/enrichment/` for ~4 accounts. All others return 0% enrichment score.
**Action:** Add `RAPIDAPI_KEY` to Vercel environment variables and re-run enrichment for all accounts.

---

## 🟢 No Blocker — Ready to build when prioritized

### 3. Authentication system
**Decision needed:** Who are the users? Single-tenant (just Skyvera team) vs multi-tenant?
**Simple path:** Add NextAuth.js with Google OAuth — 1 day of work.

### 4. PostgreSQL / Turso migration
**Reason:** SQLite has write concurrency issues in production (Vercel serverless).
**Simple path:** Turso (libSQL hosted, SQLite-compatible) — minimal code changes.

### 5. RapidAPI enrichment for all 140 accounts
**What:** Run `scripts/enrich-accounts.ts` to populate `data/enrichment/` for every customer.
**Depends on:** Item 2 (RapidAPI key in env).

### 6. Sentry error monitoring
**What:** Add Sentry DSN to env vars and wrap `_app` with Sentry provider.
**Effort:** ~1 hour.

---

## ✅ Recently Resolved

| Date | Item | Resolution |
|------|------|------------|
| 2026-04-06 | fix/pr-review-hardening merge | Already on origin/main (was pushed directly) |
| 2026-03-10 | 14 PR review issues | Fixed in `eda6b2a` |
| 2026-03-10 | Export/PDF functionality | Implemented via `@media print` |
| 2026-03-10 | Inline status editing | StatusCycleButton + PATCH API routes |
| 2026-03-10 | Account search | URL-driven with server-side filtering |
| 2026-03-10 | Data completeness scoring | 7-dimension 0-100 badge on accounts page |
| 2026-03-10 | AI chat per account | Streaming Claude panel in account detail |
