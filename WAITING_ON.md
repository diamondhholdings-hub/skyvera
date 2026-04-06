# WAITING_ON.md — Skyvera Intelligence Platform

> Blockers and external dependencies that require human action before work can continue.
> Last updated: 2026-04-06

---

## 🔴 Blocking — Cannot proceed without these

None currently.

---

## 🟡 Pending Human Action

None currently — all API keys configured.

---

## 🟢 No Blocker — Ready to build when prioritized

### 3. Authentication system
**Status:** On hold by design. Revisit when platform is ready for broader access.

### 4. Supabase (PostgreSQL) migration
**Decision:** Use Supabase — already in use on other Vercel projects.
**Reason:** SQLite has write concurrency issues in production (Vercel serverless).
**Next:** Connect Supabase project, update DATABASE_URL, run `prisma db push`, re-seed.
**Action needed:** Provide Supabase connection string or link the project via Vercel Supabase integration.

### 5. RapidAPI enrichment for all 140 accounts
**What:** Run `npm run enrich:accounts` — in progress as of 2026-04-06 (~19 min, sequential with 500ms guard).
**Status:** 3/3 test accounts succeeded. Full run kicked off in background.

### 6. Sentry error monitoring
**What:** Add Sentry DSN to env vars and instrument error tracking.
**Effort:** ~1 hour.

---

## ✅ Recently Resolved

| Date | Item | Resolution |
|------|------|------------|
| 2026-04-06 | RAPIDAPI_KEY added to Vercel + .env.local | Enrichment pipeline live; bulk run in progress |
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
