# Skyvera — Next Priority List
**Generated:** 2026-08-05
**Purpose:** Ready for /clear — full context for next session
**Branch:** fix/pr-review-hardening (PR #2 from the 2026-05-08 cycle already merged to `main` in commit `efc01d0` — see "What Changed Since Last Audit" below)

---

## What Changed Since the 2026-05-08 Audit

The prior version of this file had two top items — "merge PR #2" and "fix the three beads issues" — as its headline priorities. **Both are done.** PR #2 (`fix(a11y+tsc): WCAG 2.2 hardening, Zod v4 migration, test fixes`) merged to `main`, and all three open beads issues (`skyvera-prf`, `skyvera-iph`, `skyvera-0yu`) are closed. 0 open beads issues remain. Full detail in `WAITING_ON.md`'s "Recently Resolved" table.

Since then, a fresh adversarially-verified code review (2026-08-05) surfaced a new batch of **confirmed** findings — mostly security gaps that predate this session but had never been reviewed. **Items 1, 2, 3, and 5 below (and both dormant bugs in item 11) were fixed in the same session, immediately after the review surfaced them** — see the "Fixed same-session" note on each. The scores in `SYSTEM_REVIEW_2026-08-05.md` and `TOP_1_PERCENT.md` reflect the point-in-time finding, not the post-fix state; both docs carry an addendum noting what closed afterward. Only item 4 (npm audit) remains genuinely open from this review.

---

## Immediate (do first in next session)

### ~~1. Lock down `/api/seed`~~ — FIXED same-session (2026-08-05)
`POST /api/seed` now returns 403 when `NODE_ENV`/`VERCEL_ENV` is `production`, closing the unauthenticated full-data-wipe path. No further action needed unless the team later wants a shared-secret header instead of an environment gate.

### ~~2. SOQL injection + unauth/no-rate-limit on `/api/salesforce/sync/[accountName]`~~ — FIXED same-session (2026-08-05)
`findAccount()` now escapes backslashes before quotes (`accountName.replace(/\\/g, '\\\\').replace(/'/g, "\\'")`), and the route now calls `rateLimit()` (5 req/min). Not done: a stronger allow-list/auth check on the route — the escaping fix closes the injection, but the route is still otherwise open. Revisit if this becomes a real attack surface concern.

### ~~3. Rate limiting on the 4 unprotected routes~~ — FIXED same-session (2026-08-05)
All four now call `rateLimit()` matching sibling routes: `/api/scenarios/conversation/[conversationId]/refine` and `/compare` (10 req/min), `/api/product-agent/generate-prd` (5 req/min, plus a new Zod schema replacing the untyped interface-cast body), and `/api/dm-strategy/accept-recommendation` + `/defer-recommendation` (20 req/min, plus new Zod schemas).

### 4. Triage npm audit — 14 vulnerabilities (1 critical, 11 high)
**Confirmed** via `npm audit --json`: `{info:0, low:1, moderate:1, high:11, critical:1, total:14}`. Not yet triaged as of this session.
**Effort:** 1–3 hours depending on how many require breaking major-version bumps.
**Action:** Run `npm audit` for full detail, resolve the critical and high findings first (patch, upgrade, or documented accept-risk with justification), re-run to confirm.

---

## High Priority — Next 1-2 Sessions

### ~~5. DM% inconsistency bug on `/dm-strategy` page~~ — FIXED same-session (2026-08-05)
`portfolio-dashboard.tsx:90` now computes `currentDM` as an ARR-weighted average (`sum(bu.currentDM * bu.arr) / sum(bu.arr)`) instead of an unweighted mean across BUs. Not verified: whether this now exactly matches `DMStrategyHero`'s `dashboardStats.ttmDM` value bit-for-bit (both are ARR-weighted now, but sourced from separate code paths) — worth a quick visual diff next session if it matters for a demo.

### 6. Add auth check + rate limiting to `/api/health`
**Confirmed.** Unauthenticated `GET /api/health` discloses which integrations/secrets are configured — `anthropicKeyConfigured`, `newsApiKeyConfigured`, `databaseUrl` presence, plus per-adapter health/status and cache stats. No secret *values* leak, but it's a reconnaissance gift to anyone probing the deployment (confirms exactly which attack surfaces — Claude, NewsAPI, DB — are live).
**Effort:** 30 minutes. Low urgency relative to items 1-4 (info disclosure only, no value leak) but cheap to fix — bundle it with item 3's rate-limiting pass.

### 7. Supabase Migration (SQLite → PostgreSQL)
**Decision already made** (per `WAITING_ON.md`) but **not yet executed**. Still the single biggest standing production-reliability risk: SQLite on Vercel's ephemeral serverless filesystem cannot safely handle concurrent writes — collisions are not theoretical, they will happen the moment two users interact with the platform (account plan edits, DM accept/defer, seed) at the same time.
**Effort:** 3–4 hours.
**Steps:**
- Provision Supabase project (already in use on other Vercel projects per `WAITING_ON.md` — reuse existing account), get `DATABASE_URL`.
- Update `prisma/schema.prisma` datasource to `postgresql`.
- Run `npx prisma migrate dev` / `prisma db push` against Supabase, re-seed.
- Update Vercel env var `DATABASE_URL`.
- Verify account-plan CRUD and the newly-fixed DM accept/defer routes (the most write-heavy paths).
**Decision needed from Todd:** Confirm Supabase tier — free tier pauses after 1 week inactivity (bad for a live demo platform), Pro ($25/mo) is always-on and the right call for anything demoed to external parties.

### 8. Install Sentry error monitoring
No error monitoring exists — production failures are currently invisible. Still the fastest infrastructure win available, unchanged from last audit.
**Effort:** ~1 hour.
- `npm install @sentry/nextjs`, run `npx @sentry/wizard@latest -i nextjs`.
- Add `SENTRY_DSN` to `.env.local` and Vercel env vars.
- Wrap `ClaudeOrchestrator` and the enrichment pipeline with breadcrumbs.
- Verify capture on a forced 500 in dev.

### 9. Fix rate limiter's IP-spoofing trust + per-process statelessness
**Confirmed.** `getClientIp()` in `src/lib/middleware/rate-limit.ts:69` takes the first comma-split entry of `X-Forwarded-For` with no verification that it came from a trusted upstream proxy — trivially spoofable by anyone setting that header directly. Separately, the store is a plain in-memory `new Map()` (line 43) with no shared backing, so on Vercel it does **not** share state across serverless instances or regions — every route's rate limiting is far weaker in production than the code comments imply. This compounds items 1-3 above: even after adding `rateLimit()` calls to the unprotected routes, the limiter itself is not a strong guarantee on this hosting model.
**Effort:** 2–4 hours for a real fix (shared store — Vercel KV/Upstash Redis — plus trusted-proxy-aware IP extraction); document the limitation clearly if deferred.

---

## Medium Priority — This Month

### 10. Mobile Responsiveness Audit
Not started. Executives demo platforms on phones — if Skyvera breaks on mobile, it fails in the moment that matters most. The 8-tab account detail page is the hardest surface.
**Effort:** 4–8 hours.
- Audit all pages at 390px viewport (iPhone 15 width).
- Fix navigation and PageHeader first (most visible).
- Collapse 8-tab account detail to scrollable sections on mobile.
- Test on an actual device, not just DevTools.

### ~~11. Dormant double-counting / merge-order bugs~~ — FIXED same-session (2026-08-05)
Both fixed even though neither had a live caller (cheap, zero-risk, and closes a credibility gap the rescored TOP_1_PERCENT.md called out explicitly): `ExcelAdapter.getStats()` now excludes the `'Skyvera'` rollup entry from its `totalRevenue` sum; `DataValidator.reconcile()` now applies sources highest-priority-last so Excel correctly wins over cache on overlapping fields.

### ~~12. Repo Hygiene~~ — PARTIALLY FIXED same-session (2026-08-05)
The 100+ stray `' 2'`-suffixed duplicate files were deleted (confirmed byte-identical/empty before removal, none were git-tracked). 21 clearly-superseded one-off root markdown files (`HANDOFF.md`, `HANDOFF_RESOLVED.md`, `TODO.md`, and 18 more DM-pipeline/OSINT/account-generation build-completion summaries with current equivalents already living under `docs/`) were moved — not deleted — to `docs/archive/` via `git mv`, fully reversible. Still outstanding, deliberately not touched:
- `.git` is still ~196MB — shrinking it means rewriting history, which needs Todd's explicit sign-off (breaks other clones/forks).
- The untracked tooling directories (`.agents/`, `.cortex/`, `.claude/skills/`, `skills-lock.json`, ~9 screenshot PNGs at root) — purpose still unconfirmed, still needs Todd's input before touching.
**Effort remaining:** whatever it takes to have that conversation with Todd about the two items above — no more autonomous cleanup to do here.

### ~~13. Data Export (CSV download)~~ — FIXED same-session (2026-08-05)
`GET /api/export/accounts` (rate limited) + a download button on the accounts page, hidden from print view. Not done: scenario-results export — a smaller follow-up if it's ever wanted.

### 14. Alerting / Scheduled Delivery
The platform is currently pull-only. A weekly digest email (top 3 at-risk accounts, RR movement, key OSINT alerts) would drive retention.
**Effort:** 4–6 hours.
- Vercel Cron job: weekly Monday 7am digest.
- Send via Resend or Postmark (both have sufficient free tiers for internal use).
- Add `RESEND_API_KEY` to env vars.

### 15. NewsAPI Integration
`NEWSAPI_KEY` env var is defined but not populated in production. The adapter likely already exists but is dormant.
**Effort:** 1–2 hours.
- Add `NEWSAPI_KEY` to Vercel env vars, verify adapter is included in the enrichment pipeline, confirm degraded mode still works when key is missing.

---

## Low Priority / Future

### 16. SSO/SAML Authentication
On hold intentionally by design (per `WAITING_ON.md`) — not a defect. Revisit when there's a specific reason to share the platform outside the immediate team, or an enterprise customer asks about auth during procurement. When it's time: Auth.js with Okta or Azure AD provider, ~4–8 hours.

**Note:** The unauthenticated `/api/seed` wipe and the Salesforce sync injection (formerly items 1-2 above) were fixed same-session and did not wait on the broader auth timeline — that's the right model for anything with this severity going forward too.

### 17. Salesforce/HubSpot CRM Integration (deeper, beyond the sync route bugfix)
Biggest competitive gap for enterprise positioning. Do not start until there's a concrete use case (a sales team wants to use Skyvera, not just finance/ops).

### 18. White-Labeling
Relevant only if Skyvera becomes a product sold to other companies. Premature without product-market-fit signal.

### 19. Resolve `aggregateByBU` Tech Debt
`byBU` map in `src/lib/data/adapters/excel/transforms.ts` is never populated. Documented tech debt. Fix when BU-level aggregation is needed for a specific feature.

### 20. Audit Log
Required for enterprise compliance ("who queried what when"). Build after auth exists — audit logs are meaningless without user identity.

---

## Decisions Needed From Todd

| Decision | Context | Options |
|----------|---------|---------|
| `/api/seed` lockdown approach | Fixed same-session with an env-gate (blocks in production). Open question: is that sufficient long-term, or should it also get a shared-secret header? | Keep env-gate only (current state) vs. add shared-secret header too |
| Supabase tier | Free tier pauses after 1 week inactivity; bad for a live demo platform | Free (dev only) vs Pro ($25/month, always-on, recommended) |
| Rate limiter architecture | In-memory per-process doesn't share state across Vercel serverless instances | Accept as documented limitation for now, or invest 2-4hrs in Vercel KV/Upstash-backed shared store |
| `.git` history rewrite | ~196MB from committed binaries (budget xlsx, dashboard HTML exports) | Rewrite history to shrink (coordinate carefully — breaks existing clones/forks) vs leave as-is |
| Auth timing | Currently intentionally on hold | Confirm: still on hold? (Note: this does NOT block fixing items 1-2, which are urgent regardless) |
| Mobile priority | Not started; high value for phone demos | Prioritize above data export, or after Supabase migration? |
| NewsAPI key | Adapter may exist but key not in Vercel | Activate now (quick win) or defer? |
| Export format | CSV is simplest; Excel (.xlsx) is more exec-friendly | CSV or .xlsx for data export? |

---

## Context for Next Session

**Current branch state:**
- `fix/pr-review-hardening` — this was PR #2, already merged to `main` (commit `efc01d0`). If this local branch still exists, it's safe to delete; `main` has everything.

**What was done since the 2026-05-08 audit (all merged to `main`):**
- WCAG 2.2 / ARIA hardening (47 findings), Zod v4 migration (tsc 0 errors), CI lockfile-drift fix.
- Budget data refreshed to Q3'26 (`2026-07-02 Skyvera - Budget - Q3'26 - Final - For Todd.xlsx`), replacing the Q1'26 workbook everywhere it's referenced by filename.
- Real financial metrics wired in place of hardcoded benchmarks (per-BU Prior Plan RR/revenue, real Margin Targets, AR>90 total, YoY/Rule of 40).
- Fixed a real bug: `getDashboardData()` was double-counting the consolidated `'Skyvera'` P&L entry with the three per-BU entries, ~doubling every headline dashboard KPI.
- BU performance table now links to `/accounts?bu=<name>` (filter now actually wired).
- DM briefing Accept button now functional (optimistic update + toast + API call).
- Test fixtures updated for Q3'26 churn (hero account fixture swapped: BT PLC → Telefonica UK Limited).
- All 4 open beads issues closed. 0 open beads issues remain.
- Result: 161/161 unit tests, 49/49 smoke tests, tsc 0 errors, CI green.

**What a fresh adversarial code review found this session, and what happened to each finding:**
- Critical, FIXED: unauthenticated `/api/seed` full data-wipe; SOQL injection on `/api/salesforce/sync/[accountName]`.
- High, FIXED: 4 routes missing rate limiting/validation now have it.
- High, STILL OPEN: `/api/health` discloses integration config to unauthenticated callers; rate limiter trusts spoofable `X-Forwarded-For` and doesn't share state across Vercel instances (item 6 and item 9 above).
- Medium, FIXED: live DM% inconsistency bug on `/dm-strategy`; both dormant double-counting/merge-order recurrences.
- Critical, STILL OPEN: 14 npm audit vulnerabilities (1 critical, 11 high) — not yet triaged (item 4 above, now the single highest-priority remaining item from this review).
- Full detail in `SYSTEM_REVIEW_2026-08-05.md` (has a post-fix addendum) and `WAITING_ON.md`.

**Current real Q3'26 financial figures** (for reference — do not use stale Q1'26 numbers in any future doc):
- Consolidated (Cloudsense/Kandy/STL): Revenue $12.72M/quarter, RR $11.29M, NRR $1.43M, Net Margin 61.4% (target 63.0%, delta -$199K), EBITDA $7.82M, AR>90 $9.81M, YoY -20.4%, Rule of 40 = 41.0%.
- Cloudsense: Revenue $7.31M, RR $6.31M (PP $6.48M), Net Margin 59.6%, Target 60%, 53 customers.
- Kandy: Revenue $2.87M, RR $2.87M (PP $3.40M), Net Margin 59.2%, Target 60%, 19 customers.
- STL: Revenue $0.79M, RR $0.65M (PP $0.68M), Net Margin 55.9%, Target 75%, 14 customers.
- Total customers in snapshot: 101 (Cloudsense 53 + Kandy 19 + STL 14 + NewNet 15) — README/PRODUCT.md's old "140+ enterprise accounts" figure is stale.
- Headcount is still a hardcoded 58 FTEs (not wired to the HC Budget Input sheet).

**Platform state:**
- Deployed: https://skyvera.vercel.app
- SQLite locally and in production (Vercel) — migration to Supabase decided but not executed (item 7).
- No auth (by design, on hold) — the two items that couldn't wait for it (`/api/seed`, Salesforce sync) were fixed same-session regardless.
- No error monitoring (Sentry not yet installed).
- Overall system score at time of review: B+ (88/100), down from A- (94/100) on 2026-05-08. Most of what drove the drop (SOQL injection, data-wipe endpoint, missing rate limiting, DM% bug, dormant double-count bugs) was fixed in the same session — see the addendum in `SYSTEM_REVIEW_2026-08-05.md` and `TOP_1_PERCENT.md` for the post-fix picture; neither score has been formally re-run.

**The highest-impact items for next session, in order:**
1. npm audit triage (1-3 hrs, closes 1 critical + 11 high dependency vulnerabilities — the only critical/high item left open from this review)
2. Supabase migration (3-4 hrs, biggest standing production-reliability risk)
3. `/api/health` info disclosure + rate limiter architecture (item 6 + item 9, ~30 min + 2-4 hrs)

Run `bd ready` at the start of next session — 0 open beads issues currently, so file new ones for item 1 (and any of 2-3 you want to start) before starting work on them.
