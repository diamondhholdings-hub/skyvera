# Skyvera — Next Priority List
**Generated:** 2026-05-08 (post-documentation audit)
**Purpose:** Ready for /clear — full context for next session
**Branch:** fix/pr-review-hardening (PR #2 open, not yet merged)

---

## Immediate (do first in next session)

### 1. Merge PR #2 (fix/pr-review-hardening → main)
WCAG fixes + Zod hardening are complete. All tests pass (161 unit + 49 smoke). CI is green. This branch has been sitting open and main cannot be deployed with latest fixes until it merges. No decisions needed — merge it.
```bash
gh pr merge 2 --squash
git checkout main && git pull
```

### 2. Install Sentry (~1 hour, high production value)
No error monitoring means production failures are invisible. This is the fastest high-value infrastructure win available.
- `npm install @sentry/nextjs`
- Run `npx @sentry/wizard@latest -i nextjs`
- Add `SENTRY_DSN` to `.env.local` and Vercel env vars
- Wrap the ClaudeOrchestrator and enrichment pipeline with Sentry breadcrumbs
- Verify error capture on a forced 500 in dev

---

## High Priority — Next 1-2 Sessions

### 3. Supabase Migration (SQLite → PostgreSQL)
The single biggest production risk. SQLite cannot handle concurrent serverless writes from Vercel's edge functions. When two users query simultaneously, writes can collide. This is not theoretical — it will happen in any live demo with multiple viewers.

**Effort:** 3–4 hours
**Steps:**
- Provision Supabase project, get `DATABASE_URL` (postgres connection string)
- Update `prisma/schema.prisma` datasource to `postgresql`
- Run `npx prisma migrate dev` against Supabase
- Update Vercel env var `DATABASE_URL`
- Verify account plans CRUD (the most write-heavy routes)
- Remove SQLite `dev.db` from `.gitignore` consideration (it shouldn't be committed)

**Decision needed from Todd:** Which Supabase tier? Free tier has 500MB DB limit + pauses after 1 week inactivity. Pro ($25/month) is always-on. For a live demo environment, Pro is the right call.

### 4. Fix skyvera-0yu (P2): Wire financial-summary hardcoded metrics to data layer
This is P2 — the only P2 in the open issues. Hardcoded metrics in the financial summary mean the dashboard shows stale data regardless of what's in the Excel file or database. This directly undermines the platform's core value proposition.

**Effort:** 2–3 hours
- Identify all hardcoded values in the financial summary component
- Wire to `src/lib/data/server/` fetchers or Excel parser
- Add unit tests for the data path
- Verify numbers match the Excel source

### 5. Fix skyvera-prf (P3): DM briefing Accept button handler
The Accept button in DM briefings has no handler — clicking it does nothing. This is visible in any demo of the DM strategy page. Small fix, high demo-day risk.

**Effort:** 30–60 minutes
- Add `onClick` handler to Accept button in DM briefing component
- Handler should: optimistic update → PATCH to `/api/dm-strategy` → revert on error
- Follow the inline status edit pattern already used elsewhere in the codebase

### 6. Fix skyvera-iph (P3): BU performance table row navigation
BU performance table rows should navigate to the BU detail view on click but don't. Another small fix with visible demo impact.

**Effort:** 30–60 minutes
- Add `onClick` or wrap rows in `<Link>` to the appropriate BU route
- Verify keyboard navigation works (Tab + Enter)

---

## Medium Priority — This Month

### 7. Mobile Responsiveness
Not started. Executives absolutely demo platforms on phones — if Skyvera breaks on mobile, it fails in the moment that matters most. The 8-tab account detail page is the hardest surface.

**Effort:** 4–8 hours (depends on how broken mobile currently is)
**Approach:**
- Audit all pages on 390px viewport (iPhone 15 width)
- Fix navigation and PageHeader first (most visible)
- Collapse 8-tab account detail to scrollable sections on mobile
- Test on actual device, not just DevTools

### 8. Data Export (CSV download)
Executives need to pull data into Excel for board prep. Currently there is no export path from any page. A CSV download on the accounts table and the financial summary is the minimum viable export.

**Effort:** 2–3 hours
- Add export endpoint `/api/export/accounts` returning CSV
- Add download button to accounts page (hidden from print view)
- Consider: scenario results export too

### 9. Alerting / Scheduled Delivery
The platform is currently pull-only. Executives who don't remember to visit daily miss the intelligence. A weekly digest email (top 3 accounts at risk, RR movement, key OSINT alerts) would drive retention and demonstrate ongoing value.

**Effort:** 4–6 hours
- Vercel Cron job: weekly Monday 7am digest
- Template: 3 at-risk accounts, RR delta, 3 notable OSINT signals
- Send via Resend or Postmark (both have free tiers sufficient for internal use)
- Add `RESEND_API_KEY` to env vars

### 10. NewsAPI Integration
`NEWSAPI_KEY` env var is defined but not populated in production. The news intelligence adapter (`src/lib/data/adapters/external/`) presumably exists but is dormant. Activating it would enrich account OSINT reports with real-time news.

**Effort:** 1–2 hours (adapter likely already written)
- Add `NEWSAPI_KEY` to Vercel env vars
- Verify adapter is included in the enrichment pipeline
- Test on a few accounts with known news coverage
- Confirm degraded mode still works when key is missing

---

## Low Priority / Future

### 11. SSO/SAML Authentication
Auth is on hold intentionally. When it becomes relevant (enterprise customer procurement, or sharing the platform with stakeholders outside Skyvera), use Auth.js with Okta or Azure AD provider. Estimated 4–8 hours when the time comes.

**Do not start until:** There is a specific reason to share the platform outside the immediate team, OR a potential enterprise customer asks about auth during procurement.

### 12. Salesforce/HubSpot CRM Integration
The biggest competitive gap for enterprise positioning. SFDC is the system of record for pipeline and account ownership at most enterprise buyers. Without it, Skyvera cannot become the primary account intelligence surface for sales teams.

**Do not start until:** There is a concrete use case (a sales team wants to use Skyvera, not just finance/ops).

### 13. White-Labeling
Relevant only if Skyvera becomes a product sold to other companies rather than used internally. Premature without product-market-fit signal.

### 14. Resolve aggregateByBU Tech Debt
The `byBU` map in `src/lib/data/excel/transforms.ts` is never populated. This is documented tech debt. Fix it when BU-level aggregation is needed for a specific feature, not as standalone work.

### 15. Audit Log
Required for enterprise compliance ("who queried what when"). Build after auth exists, since audit logs are meaningless without user identity.

---

## Decisions Needed From Todd

| Decision | Context | Options |
|----------|---------|---------|
| Supabase tier | Free tier pauses after 1 week inactivity; bad for a live demo platform | Free (acceptable for dev only) vs Pro ($25/month, always-on, recommended) |
| Auth timing | Currently intentionally on hold | Confirm: still on hold? Or is there now a reason to enable it? |
| Mobile priority | Not started; high value for phone demos | Prioritize above data export? Or wait until after Supabase migration? |
| NewsAPI key | Adapter may exist but key not in Vercel | Activate now (quick win) or defer? |
| Export format | CSV is simplest; Excel (.xlsx) is more exec-friendly | CSV or .xlsx for data export? |

---

## Context for Next Session

**Current branch state:**
- `fix/pr-review-hardening` — PR #2 open, all tests pass, merge it immediately
- After merge, `main` becomes the working branch for all new work

**What was done in this session:**
- Created `COMPETITIVE_ANALYSIS.md` — full competitor landscape, scoring matrix, moat analysis
- Created `TOP_1_PERCENT.md` — 10-criterion platform assessment, overall 8.4/10, top 1% verdict with asterisk on Production Readiness (6/10)
- Created `NEXT_PRIORITIES.md` (this file)

**Platform state:**
- Deployed: https://skyvera.vercel.app
- 140 accounts enriched (RapidAPI + OpenCorporates)
- 161 unit tests + 49 smoke tests all passing
- WCAG 2.2 compliant (post PR #2)
- tsc 0 errors
- SQLite locally, Vercel SQLite in production (blocking issue)
- No auth (by design)
- No error monitoring (Sentry not yet installed)

**The two things that will have the most impact on production reliability:**
1. Sentry (1 hour) — makes failures visible
2. Supabase migration (3–4 hours) — prevents concurrent write collisions

**The two things that will have the most impact on demo quality:**
1. Mobile responsiveness — phones are used in demos
2. skyvera-prf (DM briefing Accept button) — dead UI in a demo is bad

**Open beads issues:**
- `skyvera-prf` (P3): DM briefing Accept button handler
- `skyvera-iph` (P3): BU performance table row navigation
- `skyvera-0yu` (P2): Wire financial-summary hardcoded metrics to data layer

Run `bd ready` at the start of next session to see current issue state.
