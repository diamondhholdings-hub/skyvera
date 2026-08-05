# Skyvera Executive Intelligence System — System Review
**Date:** August 5, 2026
**Previous Review:** May 8, 2026 (A-, 94/100)
**Reviewer:** Claude Code (Sonnet 5)
**Branch:** main (PR #2 merged as commit `efc01d0`)

---

> **Post-review addendum (same session, immediately after this review ran):** The critical/high
> findings below that had a live production impact were fixed before this session ended — the
> SOQL injection, the unauthenticated `/api/seed` data-wipe, rate limiting/validation on all 5
> flagged routes, the live DM% weighting bug, and both dormant double-counting/merge-order
> recurrences. **This review's B+ (88/100) score and the Security (45) / Code Quality (85)
> component scores below were NOT re-run after those fixes** — they describe the state this
> review actually tested, which is the honest record of what the adversarial pass found before
> anyone acted on it. Still genuinely open: the 14 npm audit vulnerabilities (1 critical, 11
> high), `/api/health`'s info disclosure, and the rate limiter's in-memory/spoofable-IP
> architecture. See `NEXT_PRIORITIES.md` for the current, accurate status of every finding below.

---

## Executive Summary

Since the May 8 review, PR #2 ("fix(a11y+tsc): WCAG 2.2 hardening, Zod v4 migration, test fixes") merged to main. It delivered exactly what it promised: 47 WCAG 2.2 findings resolved, the 24 pre-existing Zod v4 TypeScript errors fixed (tsc is still 0 errors, reconfirmed live in this review), a drifted `package-lock.json` that was silently breaking `npm ci` in CI fixed, the Q1'26 budget workbook swapped for the current Q3'26 workbook with every dependent script updated, several hardcoded financial benchmarks replaced with real per-BU figures pulled from the Excel P&L sheets, the BU-table-to-accounts-page navigation wired, the DM briefing "Accept" button wired to a real API call, stale test fixtures replaced (a churned hero account swapped for the current top-revenue customer), and all 4 open beads issues closed. 161/161 unit tests and 49/49 smoke tests were green at merge, and tsc remains at 0 errors as of this session.

The most important shipped item is not on that list of features — it's a bug. While wiring real financial metrics, this session's engineering work discovered that `getDashboardData()` was summing the consolidated "Skyvera" P&L entry together with the three per-BU entries it already contains, roughly **doubling every headline dashboard KPI** (revenue, RR, EBITDA) that executives were reading. It was found and fixed as part of the same PR. That fix is the best thing that happened in this cycle, and it is also the reason this review runs an adversarial pass rather than taking the green CI dashboard at face value: a bug of that magnitude survived in a "PASS" state (tsc clean, all tests green, CI green) for an unknown number of review cycles because nothing in the test suite asserted the actual arithmetic. Adversarial review applied to the rest of the codebase this session found the same bug class alive in two more places, plus a separate live inconsistency in the DM strategy page, plus a materially worse security picture than the May 8 review assessed.

**The headline finding this cycle is security, not accessibility or types.** A SOQL-injection-capable, completely unauthenticated Salesforce sync endpoint exists at `/api/salesforce/sync/[accountName]`. An unauthenticated `/api/seed` endpoint unconditionally deletes every `Customer` and `Subscription` row in the database on a bare POST. Four more routes — two of them Claude-backed, two of them DB-mutating — skip the rate limiting and validation that their sibling routes in the same directory apply, an inconsistency rather than a deliberate design choice. `npm audit` reports 14 unresolved vulnerabilities including one critical and eleven high. None of this is new code from this cycle; it was already there in May and was not caught by the May 8 review, which scored Security at 85/100 without an adversarial pass against unauthenticated write paths. This review's Security score reflects what adversarial testing actually found, not what the previous review's methodology was able to see.

None of the May 8 structural gaps have closed: no authentication, SQLite still in production on serverless Vercel, no Sentry, mobile unaudited, and — newly relevant — root-directory clutter has grown rather than shrunk (38+ markdown files, a 198MB `.git`, and several untracked tooling directories of unclear provenance sitting in the working tree at review time).

The honest assessment: this is a platform whose intelligence layer, architecture, and type safety remain genuinely excellent, and whose engineering process (finding and fixing the double-counting bug) is a real strength. But it is currently carrying unauthenticated data-destruction and injection-class vulnerabilities in production-reachable routes, and the previous review's security score did not reflect that because it wasn't tested for. The letter grade this review assigns is materially lower than May 8's, and that drop is a corrected estimate, not a regression — nothing changed for the worse between May and August except the discovery of what was already true.

---

## Overall Score: B+ (88/100)

Down from 94/100 (-6 points overall). The functionality, architecture, type-safety, and testing gains from PR #2 are real and are reflected below. They are outweighed by a Security score that dropped from 85 to 45 once this review tested unauthenticated write paths and dependency health rather than only rate-limiter unit behavior, and by a Code Quality deduction for a live, user-visible correctness bug (DM% shown two different ways on the same page) plus two dormant instances of the exact bug class that was just fixed elsewhere in the same codebase.

---

## Scoring Breakdown

| Dimension | May 8 Score | Aug 5 Score | Change | Justification |
|-----------|-------------|-------------|--------|----------------|
| Functionality | 100/100 | 100/100 | = | All prior features plus: BU-table navigation wired to `/accounts?bu=`, DM briefing Accept button wired to `POST /api/dm-strategy/accept-recommendation`, real per-BU financial metrics replacing hardcoded benchmarks. All 4 open beads issues closed. |
| Architecture | 98/100 | 98/100 | = | No structural change. Adapter pattern, priority queue, semantic layer, degraded mode all intact. |
| Code Quality | 97/100 | 85/100 | -12 | tsc still 0 errors (reconfirmed live this session). But: a live, user-visible bug (DM% computed two different ways on the same `/dm-strategy` page — 92.4% vs ~90.2%) was found; the exact double-counting bug class just fixed in `getDashboardData()` was found dormant in two more places (`ExcelAdapter.getStats()`, `DataValidator.reconcile()`); 124 untracked byte-duplicate " 2"-suffixed files sit in the tree as drift risk. The fix that shipped is good; the fact that three more instances of the same defect pattern exist elsewhere is a process signal, not a one-off. |
| Testing | 96/100 | 96/100 | = | Still 161/161 unit, 49/49 smoke, CI green. No regression, but also no new coverage added to catch the correctness-bug class this review surfaced (no test asserts dashboard totals against a known-good sum, no test asserts the two DM% code paths agree). |
| Security | 85/100 | 45/100 | -40 | Unauthenticated SOQL-injection-capable Salesforce sync route. Unauthenticated `/api/seed` unconditionally deletes all Customer/Subscription rows. Four routes (2 Claude-backed, 2 DB-mutating) inconsistently skip rate limiting/validation that sibling routes in the same directory apply. `/api/health` discloses which secrets are configured to unauthenticated callers. Rate limiter still trusts unverified X-Forwarded-For and is in-memory per-process. `npm audit`: 14 vulnerabilities (1 critical, 11 high) untriaged. None of this is new since May — it is newly *found*. |
| Performance | 98/100 | 98/100 | = | No change. |
| Design | 95/100 | 95/100 | = | No change; DESIGN.md/PRODUCT.md still current modulo the stale "140+ accounts" figure (see Documentation). |
| Accessibility | 92/100 | 92/100 | = | No regression from the 47-finding hardening pass; no new a11y-specific audit run this cycle. |
| Documentation | 93/100 | 88/100 | -5 | README/PRODUCT.md still say "140+ enterprise accounts"; real current count is 101 (53 Cloudsense + 19 Kandy + 14 STL + 15 NewNet) following normal quarter-over-quarter account churn (e.g., British Telecommunications PLC exited the Q3'26 book entirely). Root-level markdown count grew to 38+ (was 30+ in May). `.git` is ~198MB. Several untracked tooling directories (`.agents/`, `.cortex/`, `.claude/skills/`, `skills-lock.json`) and ~9 screenshot PNGs sit at repo root with no documented purpose. |

**Weighted Overall: 88/100 (B+)**

Weights unchanged from prior review: Functionality 15%, Architecture 15%, Code Quality 15%, Testing 12%, Security 12%, Performance 10%, Design 8%, Accessibility 8%, Documentation 5%.

---

## Adversarial Test Results

### TypeScript — `npx tsc --noEmit` (re-run live this session)

```
Exit code: 0
(no output)
```

**Result: PASS.** Zero type errors, reconfirmed directly rather than taken on faith from the PR #2 changelog.

### Unit Tests — `npm run test:unit` (re-run live this session)

```
RUN  v4.1.2 /Users/RAZER/Documents/projects/Skyvera

 Test Files  9 passed (9)
      Tests  161 passed (161)
   Start at  08:02:54
   Duration  440ms
```

**Result: PASS.** 161/161, unchanged from the PR #2 merge state. Note the gap this review is flagging: none of these 161 tests would have caught the `getDashboardData()` double-counting bug, the `getStats()`/`reconcile()` dormant duplicates, or the DM% two-code-paths bug — all four are correctness bugs in arithmetic/aggregation logic that a green unit suite did not (and structurally could not, without a new assertion) surface.

### Smoke Tests — `npx playwright test tests/smoke/`

Not re-executed in this review session (requires a running dev server). Last recorded result: 49/49 passing at the PR #2 merge on 2026-05-08, per CI.

### Dependency Audit — `npm audit --json` (re-run live this session)

```
{'info': 0, 'low': 1, 'moderate': 1, 'high': 11, 'critical': 1, 'total': 14}
```

**Result: FAIL (untriaged).** 14 vulnerabilities including 1 critical and 11 high. None have been triaged, upgraded around, or documented as accepted risk. This was not part of the May 8 review's test methodology.

---

## Case Study: The Double-Counting Bug — Why This Review Runs Adversarially

`getDashboardData()` computed headline dashboard KPIs (Total Revenue, Total RR, EBITDA) by summing `financialsByBU` across all entries. The Excel P&L data contains a `'Skyvera'` key that is the **consolidated** company-wide rollup, alongside the three per-BU keys (`Cloudsense`, `Kandy`, `STL`) it already aggregates. The function summed all four, which means every headline number executives saw on the dashboard was roughly double the true figure. `getBUSummaries()` had the same class of problem — the consolidated entry was showing up as a phantom fourth "BU" row, and each BU's margin target was read from a hardcoded lookup table (Cloudsense 63.6%, Kandy 75%, STL 75%) rather than each BU's actual Margin Target from the workbook (real Q3'26 values: Cloudsense 60%, Kandy 60%, STL 75%).

Both were found and fixed in this cycle. `dashboard-data.ts` now has an explicit guard and comment explaining why the consolidated entry must be read directly rather than re-summed. That is the correct fix, and finding it at all — rather than shipping another quarter of doubled KPIs to executives — is the single best outcome of this review cycle.

It is also proof that "tsc clean + tests green + CI green" does not mean "the numbers are right." Applying the same adversarial scrutiny elsewhere in this codebase during this review surfaced the identical bug class twice more, still live in the tree:

- **`ExcelAdapter.getStats()`** (`src/lib/data/adapters/excel/parser.ts:372-385`) sums `totalRevenue` across `financialsByBU` including the `'Skyvera'` consolidated entry — the exact same double-count, with no guard. It has zero current callers anywhere in `src`/scripts/tests, so it is dormant rather than live-impacting, but it is a landmine: the first caller added to this function inherits a bug that was already found and fixed once in a sibling function.
- **`DataValidator.reconcile()`** (`src/lib/data/validator.ts:122-159`) is documented as merging data sources so that higher-priority sources (Excel, priority 1) win over lower-priority ones (cache, priority 4) for overlapping fields. It sorts sources ascending by priority number, then applies `Object.assign` in that same ascending order — meaning the **lowest**-priority source, applied last, silently overwrites the highest-priority one. This inverts the function's own documented intent. It also has zero current callers, so it is dormant, but the same observation applies: it is one call site away from quietly serving stale cache data as if it were authoritative Excel data.

And a third, non-dormant instance of "two computations of the same number disagree" was found live on the `/dm-strategy` page: `portfolio-dashboard.tsx` computes portfolio "Current DM%" as an **unweighted average** of each BU's own `dm_pct` (≈90.2%), while `dm-strategy-hero.tsx` on the same page renders the ARR-**weighted** consolidated `dm_pct` (92.4%) computed independently in `adapters.ts`. Both values are shown to the same viewer on the same page with no shared source of truth and no indication that they're computed differently. This is currently live and user-visible, not dormant.

The pattern across all three: two independent computations of a number that should have exactly one authoritative source, with no test asserting the two agree. Recommendation carried into the outstanding-work list below: add a small set of "sanity" tests that assert dashboard/portfolio totals equal a known-good hand-computed sum from the fixture data, specifically to catch this bug class before it reaches a dashboard again.

---

## Verified Adversarial Findings — This Pass

All findings below were independently verified against the actual source (not taken on report alone) before inclusion. Severity is this review's assessment; "status" reflects whether the underlying code has been touched — none of these were fixed as part of this review, which is a documentation/assessment pass, not a remediation pass.

### Critical

1. **SOQL injection, unauthenticated — `src/lib/salesforce/sync.ts:26-34`.** `accountName.replace(/'/g, "\\'")` escapes single quotes but not backslashes first, so an input containing a literal backslash immediately preceding a quote produces `\\'` in the final query — read by most SOQL/SQL parsers as an escaped backslash followed by an *unescaped* closing quote. Classic incomplete-blacklist bug. The call chain (`POST /api/salesforce/sync/[accountName]/route.ts`) performs zero validation on the decoded path segment before it reaches `findAccount`. No auth, no Zod, no allow-list anywhere in the chain.
2. **Unauthenticated `/api/seed` deletes all production data.** The POST handler runs `prisma.subscription.deleteMany({})` then `prisma.customer.deleteMany({})` unconditionally, with no auth check, no rate limiting, and no confirmation flag/header/env guard, before reseeding. A bare `curl -X POST` from anyone with the URL wipes the database.

### High

3. **No rate limiting or input validation on `/api/salesforce/sync/[accountName]`.** Compounds finding #1 — the injection surface is also unthrottled. `syncContacts`/`syncOpportunities`/`syncCases` interpolate the resulting `accountId` directly into further SOQL as well; three separate filesystem writes under `data/account-plans/*` also fire from this same unauthenticated path.
4. **Missing rate limiting — `/api/scenarios/conversation/[conversationId]/refine`.** Has a Zod schema (`refineSchema`), but unlike its siblings (`analyze/route.ts`, `conversation/start/route.ts`, `conversation/[id]/message/route.ts`, all of which call `rateLimit()`), this route does not. It does invoke Claude via `manager.refineScenario`.
5. **Missing rate limiting — `/api/scenarios/conversation/[conversationId]/compare`.** Same inconsistency as #4; `manager.compareVersions` invokes Claude.
6. **Unauthenticated, unrate-limited `/api/product-agent/generate-prd`.** No Zod validation (`const body: GeneratePRDRequest = await request.json()` is an interface-only cast, not a runtime check), no `rateLimit()` call anywhere in the file, and `max_tokens: 16000` on the Claude call — a real cost/abuse vector with no guardrail.
7. **No rate limiting or schema validation on DB-mutating `/api/dm-strategy/accept-recommendation` and `defer-recommendation`.** Both do raw `request.json()` destructuring with only truthiness checks on fields like `dueDate`, `priority`, `board` — no Zod, no type/format validation, no rate limit.
8. **`npm audit`: 14 unresolved vulnerabilities (1 critical, 11 high, 1 moderate, 1 low).** Untriaged as of this review.

### Medium

9. **Rate limiter trusts the first `X-Forwarded-For` entry unconditionally and is a per-process in-memory `Map`.** `getClientIp` takes the first comma-split entry of `x-forwarded-for` with no upstream-proxy verification (spoofable), and the store has no shared/external backing, so it does not survive across serverless instances or regions. Previously flagged in the May 8 review as a P3 nicety ("Redis-backed rate limiter, optional"); this review reclassifies it as a live gap given how many routes now depend on rate limiting as their *only* abuse control.
10. **Unauthenticated `/api/health` discloses integration/secret configuration.** Response includes `anthropicKeyConfigured`, `newsApiKeyConfigured`, and `databaseUrl` presence, plus per-adapter health/status and cache stats. No secret values leak, but it's a free reconnaissance map of what's configured for an attacker probing the other unauthenticated routes above.
11. **Portfolio DM% shown two different ways on the same page.** See Case Study above — `portfolio-dashboard.tsx`'s unweighted average (~90.2%) vs the ARR-weighted `dashboardStats.ttmDM`/`currentDM` (92.4%) rendered elsewhere on `/dm-strategy`. Live, user-visible, no shared source of truth.

### Low (dormant — no current callers, but real defects)

12. **`ExcelAdapter.getStats()` double-counts the consolidated `'Skyvera'` entry** — same bug class as the fixed `getDashboardData()`. Zero current callers.
13. **`DataValidator.reconcile()` applies merge priority backwards** — lowest-priority source (cache) overwrites highest-priority (Excel) due to `Object.assign` being applied in ascending rather than descending priority order. Zero current callers.
14. **124 untracked, byte-identical " 2"-suffixed duplicate files** across components, lib, API routes, and `data/enrichment/` (confirmed via `git ls-files` that none are tracked). Byte-identical to their originals today, but pure drift risk: nothing prevents one copy from being edited without the other, and their presence in the working tree makes `find`/grep-based review noisier than it should be.

---

## What Shipped Since May 8, 2026 (PR #2, merged as `efc01d0`)

1. **WCAG 2.2 / ARIA hardening** — 47 findings resolved: tab nav as `<Link>` + `aria-current`, dialog focus trap, `<fieldset>`/`<legend>`, `prefers-reduced-motion` guard, `scroll-margin-top`, `aria-hidden` on decorative emoji, CSS token colors throughout.
2. **Zod v4 API migration** — 24 pre-existing TypeScript errors resolved (`z.record()` two-arg form, `error:` not `errorMap:`). tsc is 0 errors, reconfirmed live this session.
3. **CI-blocking bug fixed** — `package-lock.json` had drifted from `package.json`, breaking `npm ci` both locally and in GitHub Actions. Resynced.
4. **Budget data refreshed** — the Q1'26 workbook replaced with the current Q3'26 workbook (`2026-07-02 Skyvera - Budget - Q3'26 - Final - For Todd.xlsx`); every script that reads it by filename (`parse_excel_to_json.py`, `extract_dm_data.py`, `inspect_excel.py`) updated to match.
5. **Real financial metrics wired** in place of hardcoded benchmarks — per-BU Prior Plan RR/revenue, per-BU real Margin Target, AR > 90 days total, YoY revenue change, and Rule of 40, all pulled from the actual Excel sheets rather than literals.
6. **The double-counting bug** — found and fixed (see Case Study above). This is the most consequential fix in the release.
7. **BU performance table rows now link to `/accounts?bu=<name>`**, and the accounts page (which had declared but never read a `bu` searchParam) now filters on it.
8. **DM briefing widget's "Accept" button wired** — optimistic update + toast, `POST /api/dm-strategy/accept-recommendation`, action-item payload made optional for a quick-accept path.
9. **Test fixtures updated** — the smoke/e2e "hero account" fixture (British Telecommunications PLC) had churned out of the Q3'26 customer list entirely; replaced with Telefónica UK Limited (the current highest-revenue customer with full curated account-plan content). A quarter-hardcoded test locator was also fixed.
10. **All 4 open beads issues closed** (`skyvera-amw` CI fix, `skyvera-0yu` financial metrics, `skyvera-iph` BU nav, `skyvera-prf` DM accept button). 0 open beads issues as of this review, reconfirmed live (`bd list --status open` returns none).
11. **Result:** 161/161 unit tests, 49/49 smoke tests, tsc 0 errors, CI green, PR #2 merged to main.

---

## Current Q3'26 Financial Snapshot (for reference)

Consolidated Skyvera (Cloudsense/Kandy/STL): Total Revenue $12.72M/quarter, Total RR $11.29M, Total NRR $1.43M, Net Margin 61.4% (blended target 63.0%, delta -$199K), EBITDA $7.82M, AR > 90 days $9.81M, YoY revenue change -20.4%, Rule of 40 = 41.0% (this YoY calc covers only the 3 core BUs' historical comparison sheets, ~86% of total revenue — smaller divisions like PeerApp/NewNet/Mobilogy lack historical data, so this slightly underestimates the true company-wide figure).

| BU | Revenue | RR | Prior Plan RR | Net Margin | Margin Target | Customers |
|----|---------|----|----|------------|---------------|-----------|
| Cloudsense | $7.31M | $6.31M | $6.48M (-$168K) | 59.6% | 60% | 53 |
| Kandy | $2.87M | $2.87M | $3.40M (-$531K) | 59.2% | 60% | 19 |
| STL | $0.79M | $0.65M | $0.68M (-$30K) | 55.9% | 75% | 14 |

Total customers in the current snapshot: 101 across Cloudsense/Kandy/STL/NewNet (53+19+14+15) — down from the "140+ enterprise accounts" figure still quoted in README.md/PRODUCT.md, which is stale. Some prior-quarter accounts (e.g. British Telecommunications PLC) have churned out of the budget entirely between Q1'26 and Q3'26 — real business turnover, not a data bug. Headcount remains a hardcoded 58 FTEs in the code, not yet wired to the HC Budget Input sheet.

---

## Known Outstanding Risks / Debt

Carried forward from May 8 unless noted; none of these have been remediated this cycle.

- **SQLite in production on Vercel serverless** — ephemeral filesystem, write-concurrency risk. Supabase migration decision was made (per `WAITING_ON.md`) but not yet executed.
- **In-memory, per-process rate limiter** — does not share state across serverless instances/regions; weaker guarantee on Vercel than code comments imply. (Reclassified this review from P3 nicety to a live gap — see Medium finding #9.)
- **No error monitoring (Sentry) configured.**
- **`npm audit`: 14 vulnerabilities (1 critical, 1 moderate, 11 high, 1 low)** — not yet triaged or fixed (see High finding #8).
- **Repo hygiene:** `.git` is ~198MB (large committed binaries — budget xlsx, HTML dashboard exports); 38+ markdown files at repo root with overlapping/superseded content (`HANDOFF.md`, `HANDOFF_RESOLVED.md`, old `SESSION_SUMMARY` content, etc.); several untracked tooling directories (`.agents/`, `.cortex/`, `.claude/skills/`, `skills-lock.json`, ~9 screenshot PNGs at root) of unknown purpose sitting in the working tree.
- **`aggregateByBU()`** in `src/lib/data/adapters/excel/transforms.ts` builds a `Map` that is never populated (dead code / known tech debt, documented in `CLAUDE.md`).
- **No authentication system** (on hold by design per `WAITING_ON.md` — not a defect, a deliberate deferral). This deferral is now materially riskier given the newly found unauthenticated destructive/injectable routes above — "no auth by design" was a defensible posture when the worst case was reading data; it is a much worse posture when the worst case is an unauthenticated caller deleting the database or running injected SOQL.
- **Mobile responsiveness** not audited/hardened.

---

## Production Readiness Assessment

| Criterion | Status | Notes |
|-----------|--------|-------|
| TypeScript clean build | PASS | 0 errors, reconfirmed live |
| Unit tests passing | PASS | 161/161, reconfirmed live |
| Smoke tests passing | PASS (unverified this session) | 49/49 at last CI run |
| CI/CD gates | PASS | tsc + build + smoke on every PR |
| Rate limiting | PARTIAL | Applied inconsistently — 4 routes (2 Claude-backed, 2 DB-mutating) skip it while sibling routes in the same directories apply it |
| Input validation | PARTIAL | Zod missing on `/api/product-agent/generate-prd`, `/api/dm-strategy/accept-recommendation`, `/api/dm-strategy/defer-recommendation` |
| Unauthenticated destructive endpoint | **FAIL (Critical)** | `/api/seed` deletes all Customer/Subscription rows on a bare POST |
| Injection-safe external queries | **FAIL (Critical)** | SOQL injection in `src/lib/salesforce/sync.ts`, reachable via unauthenticated route |
| Dependency vulnerabilities | FAIL | 14 unresolved (1 critical, 11 high) |
| Error boundaries | PASS | 3 high-risk components wrapped |
| Graceful degradation | PASS | All external adapters have degraded mode |
| Authentication | FAIL | Not implemented (on hold — see risk note above) |
| Database (serverless-safe) | FAIL | SQLite — Supabase migration pending |
| Error telemetry (Sentry) | FAIL | Not implemented |
| Mobile responsiveness | FAIL | Desktop-only |
| CSP headers | FAIL | Not configured |
| WCAG 2.2 compliance | PARTIAL | 47 findings fixed; no automated gate |
| Correctness — single source of truth for KPIs | PARTIAL | One instance (dashboard KPIs) fixed this cycle; two dormant instances and one live instance (DM%) remain |

**Production Readiness Verdict:** Downgraded from the May 8 assessment. The May 8 review judged the platform "suitable for controlled internal use by named users who know the URL." That judgment assumed the worst-case failure mode was stale or unauthenticated *reads*. This review found unauthenticated *writes* — including a full data-wipe endpoint and an injectable external-system sync endpoint — reachable by anyone who has the URL, which is a materially different risk class than "internal tool, no auth, by design." Recommend triaging findings #1 and #2 (the two Critical items) before any further distribution of the URL, independent of the longer-term auth/Supabase roadmap.

---

## Final Scorecard

```
Skyvera Executive Intelligence Platform
System Review — August 5, 2026

Functionality     ████████████████████  100/100  A+  (=)
Architecture      ████████████████████   98/100  A+  (=)
Code Quality      █████████████████      85/100  B   (-12)
Testing           ███████████████████    96/100  A+  (=)
Documentation     █████████████████      88/100  B+  (-5)
Design            ███████████████████    95/100  A+  (=)
Performance       ████████████████████   98/100  A+  (=)
Security          █████████              45/100  F   (-40)
Accessibility     ██████████████████     92/100  A-  (=)

OVERALL           █████████████████      88/100  B+  (-6)

Previous: A- (94/100) — May 8, 2026
Current:  B+ (88/100) — August 5, 2026

The drop is a corrected estimate, not a regression: shipped features, tsc,
and tests all held or improved. Security dropped because this review tested
unauthenticated write paths and dependency health for the first time and
found a critical SOQL-injection route and an unauthenticated data-wipe
endpoint that were already there. Code Quality dropped because the same
double-counting bug class that was found and fixed once in this cycle was
also found dormant twice more, plus one live instance (DM% shown two
different ways on the same page).

Top priority before any further URL distribution: fix the SOQL injection
and unauthenticated /api/seed endpoint. Everything else on the outstanding
list (auth, Supabase, Sentry, mobile, rate-limiting consistency, npm audit)
remains real but is not new since May.
```

*Review conducted August 5, 2026. TypeScript, unit test, and `npm audit` results in this document were executed live during this session on `main` at commit `efc01d0`. Smoke test result (49/49) is carried forward from the last CI run at PR #2 merge and was not re-executed. Security and code-quality findings were independently verified against source before inclusion; none were remediated as part of this review.*
