# WAITING_ON.md — Skyvera Intelligence Platform

> Blockers and external dependencies that require human action before work can continue.
> Last updated: 2026-05-08

---

## 🔴 Blocking — Cannot proceed without these

None currently.

---

## 🟡 Pending Human Action

### PR #2 — Ready to merge
**Branch:** `fix/pr-review-hardening` → `main`
**URL:** https://github.com/diamondhholdings-hub/skyvera/pull/2
**What's in it:** WCAG 2.2 hardening (47 findings, ARIA tabs, focus trap, fieldset/legend, reduced-motion), Zod v4 migration (24 tsc errors resolved), tsc now at 0 errors.
**Action needed:** Review and merge PR #2.

---

## 🟢 No Blocker — Ready to build when prioritized

### 3. Authentication system
**Status:** On hold by design. Revisit when platform is ready for broader access.

### 4. Supabase (PostgreSQL) migration
**Decision:** Use Supabase — already in use on other Vercel projects.
**Reason:** SQLite has write concurrency issues in production (Vercel serverless).
**Next:** Connect Supabase project, update DATABASE_URL, run `prisma db push`, re-seed.
**Action needed:** Provide Supabase connection string or link the project via Vercel Supabase integration.

### 6. Sentry error monitoring
**What:** Add Sentry DSN to env vars and instrument error tracking.
**Effort:** ~1 hour.

---

## 🔧 Open Beads Issues — Implementation pending

### skyvera-0yu — Wire hardcoded financial metrics (P2)
**What:** Several financial metrics on the dashboard are hardcoded constants rather than computed from live data. Wire them to the semantic resolver / Excel adapter.
**Priority:** P2 — affects data integrity for executive use.

### skyvera-prf — DM briefing accept handler (P3)
**What:** The "Accept" button on DM strategy briefing cards has no handler wired — it logs a console warning. Needs to write accepted recommendation state to the DB.
**Priority:** P3 — UX gap, not blocking.

### skyvera-iph — BU table row navigation (P3)
**What:** BU breakdown table rows on the dashboard are not keyboard-navigable / clickable to drill into BU detail. Add row-level navigation.
**Priority:** P3 — accessibility enhancement.

---

## ✅ Recently Resolved

| Date | Item | Resolution |
|------|------|------------|
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
