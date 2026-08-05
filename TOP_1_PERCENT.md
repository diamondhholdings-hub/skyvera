# Skyvera — Top 1% Assessment
**Generated:** 2026-08-05 (rescore — supersedes 2026-05-08 assessment by Claude Sonnet 4.6)
**Evaluator:** Claude Sonnet 5
**Question:** Does this platform qualify as top 1% for AI-powered BI/intelligence tools?

> **Post-rescore addendum (same session):** The SOQL injection, the unauthenticated `/api/seed`
> data-wipe, the 3 confirmed Zod-coverage gaps, and the dormant double-counting recurrence cited
> below as the drivers of the Type Safety and Production Readiness downgrades were all fixed
> before this session ended. **The scores and verdict below were not re-run post-fix** — per the
> verdict's own closing line, this is "very plausibly a 9+/10 platform once they're closed," and
> they are now closed except for the 14 npm audit vulnerabilities. Treat the scores below as the
> honest pre-fix record, and `NEXT_PRIORITIES.md` as the current state.

---

## Methodology

This assessment evaluates Skyvera against the top 1% of AI-powered SaaS tools shipped in the 2024–2026 window. The reference population is production AI SaaS tools with real users and revenue, not demos or prototypes. Each criterion is scored 1–10, with 10 reserved for best-in-class implementations that would satisfy a senior engineering or design reviewer at a top-tier product company.

**What changed since 2026-05-08:** PR #2 ("fix(a11y+tsc): WCAG 2.2 hardening, Zod v4 migration, test fixes") merged to main — WCAG 2.2 hardening, Zod v4 migration (24 pre-existing tsc errors resolved), a CI-blocking `package-lock.json` drift fix, a refreshed Q3'26 budget workbook, real per-BU financial metrics wired in place of hardcoded benchmarks, a genuine double-counting bug found and fixed in `getDashboardData()`, BU-filtered account navigation wired up, the DM briefing "Accept" button wired to a real endpoint, and test fixtures updated for account churn between quarters. All 4 open beads issues closed. Separately, this rescore incorporates an adversarial security/correctness audit that directly read the source and confirmed several findings — some of which contradict claims made in the 2026-05-08 assessment. Scores below are revised only where evidence changed; unchanged criteria say so explicitly.

---

## Criterion 1: AI Integration Quality

**Score: 8/10** (was 9/10)

**Assessment:**
AI is still load-bearing architecture, not a feature flag. The ClaudeOrchestrator singleton (50 RPM, priority queue, per-request caching, exponential backoff) is unchanged and still genuinely good. Real per-BU financial data (Prior Plan RR/revenue, real Margin Targets, AR aging, YoY/Rule of 40) is now wired into the layer that feeds Claude's scenario modeling and DM strategy generation, in place of the hardcoded benchmarks the last audit didn't know were hardcoded — this is a direct improvement to the grounding data behind every Claude-generated recommendation, and it's the kind of unglamorous correctness work that most teams skip.

Against that, an adversarial audit confirmed the rate-limiting discipline this criterion previously credited as "mature thinking about AI pipeline reliability" is not applied consistently to every Claude-invoking route. `/api/scenarios/conversation/[conversationId]/refine` and `/compare` both invoke Claude (`manager.refineScenario`, `manager.compareVersions`) with **zero** `rateLimit()` call, while sibling routes in the same feature directory (`analyze`, `conversation/start`, `conversation/[id]/message`) all call it. `/api/product-agent/generate-prd` is worse: no auth, no rate limiting, no schema validation on the request body, and it triggers a 16,000-token Claude generation on every hit — an open cost-control hole, not a hypothetical one.

**What reaches 10/10:**
Streaming responses for long-running queries. Confidence scoring on AI outputs. Human-in-the-loop correction feeding the semantic layer. Apply `rateLimit()` uniformly to the 2 scenario endpoints and 1 product-agent endpoint confirmed missing it today.

---

## Criterion 2: Type Safety

**Score: 7/10** (was 9/10)

**Assessment:**
`tsc 0 errors` in CI is confirmed unchanged, and the Zod v4 migration that resolved the 24 pre-existing errors is real, completed work — the Result type pattern is still a genuine architectural decision, not TypeScript boilerplate.

The previous assessment's central claim — "Zod schemas cover all 22 API routes," "Zod validation at every API entry point" — is now known to be false. Direct file reads confirm `/api/dm-strategy/accept-recommendation`, `/api/dm-strategy/defer-recommendation`, and `/api/product-agent/generate-prd` all parse the request body with no Zod schema at all: the first two do raw destructuring with only truthiness checks, and the PRD route does an interface-only `as` cast with no runtime validation. Two of these mutate the database directly; the third triggers an expensive Claude call. This is exactly the class of API boundary the "Result + Zod + TypeScript, full defensive stack" claim was built on, and it doesn't hold at all three of these routes today. This isn't a new regression introduced since 2026-05-08 — it's a gap the last audit didn't catch — but it directly weakens the evidence the 9/10 score rested on, so the score moves down.

**What reaches 10/10:**
Close the 3 confirmed unvalidated routes above with Zod schemas. Zod schemas shared between client and server. Runtime type assertions on Claude API responses.

---

## Criterion 3: Accessibility

**Score: 8/10** (unchanged)

**Assessment:**
The WCAG 2.2 hardening this criterion anticipated at the last audit ("the PR #2 hardening work specifically addresses WCAG issues") has since merged: tab navigation via `Link` + `aria-current`, dialog focus traps with Escape-to-restore, `fieldset`/`legend` for grouped controls, a `prefers-reduced-motion` guard, and `aria-hidden` on decorative emoji. This is exactly the scope the last audit was already crediting in advance, so it confirms rather than changes the picture — no score movement.

**What reaches 10/10:** Unchanged — full axe-core CI integration, screen-reader testing on the 8-tab account pages, explicit focus management on tab switches.

---

## Criterion 4: Testing Coverage

**Score: 8/10** (unchanged)

**Assessment:**
Counts are confirmed unchanged: 161 Vitest unit tests, 49 Playwright smoke tests, plus E2E, with CI running type-check + build + smoke on every PR. The pyramid shape is still correct and still better than most AI SaaS tools ship with.

One honest caveat worth recording: the adversarial audit found a live, confirmed bug where the `/dm-strategy` page shows two different "Current DM%" values in two different widgets (~90.2% unweighted average in `PortfolioDashboard` vs. 92.4% ARR-weighted in `DMStrategyHero`), and it shipped through the existing 161+49 tests undetected. That's not evidence the test *count* regressed — nothing did — but it is evidence the suite doesn't yet assert cross-component consistency of computed business metrics, which is exactly the kind of bug a BI tool's test suite most needs to catch. Kept at 8/10 rather than lowered, since the counts and shape are unchanged from the last audit's basis for the score; noted here rather than used to inflate or deflate without cause.

**What reaches 10/10:** Unchanged — CI coverage gates, visual regression tests, load testing the Claude orchestrator, and (newly relevant) a cross-page consistency check on shared computed metrics.

---

## Criterion 5: Design System

**Score: 8/10** (unchanged)

**Assessment:**
No design system changes were reported or found since the last audit. PRODUCT.md + DESIGN.md, the token-based color system, `PageHeader`, and the print/PDF system are all as previously assessed. Score held flat because nothing material changed.

**What reaches 10/10:** Unchanged — component catalog, Figma/code token parity, documented component decision log.

---

## Criterion 6: Architecture

**Score: 8/10** (was 9/10)

**Assessment:**
Genuine positive: `getDashboardData()` was found to be summing the consolidated "Skyvera" P&L entry together with the three per-BU entries it already contains — roughly doubling every headline dashboard KPI (revenue, RR, EBITDA) — and this was found and fixed, now sourcing the consolidated figure directly. `getBUSummaries()` was also fixed to exclude the phantom consolidated "4th BU" row and to use each BU's real Margin Target instead of a hardcoded lookup table. This is real correctness auditing, not just feature velocity, and it's the kind of fix that's easy to skip under deadline pressure.

Set against that, the same adversarial audit found the identical bug *class* still present elsewhere, unfixed: `ExcelAdapter.getStats()` in `parser.ts` sums `totalRevenue` across `financialsByBU` including the same "Skyvera" consolidated entry — the exact double-count `getDashboardData()` was fixed for, with `dashboard-data.ts` even carrying an explicit code comment warning about it, but no equivalent guard in `getStats()`. (Dormant — `getStats()` has zero live callers today — but it's a landmine, not a hypothetical.) `DataValidator.reconcile()` was also found to invert its own documented intent: it sorts data sources by priority (Excel=1, cache=4) but then applies `Object.assign` in ascending order, so the lowest-priority cache source silently overwrites the highest-priority Excel source for any overlapping field — also dormant (zero callers) but a real logic inversion. And, live and user-facing rather than dormant: the portfolio DM% inconsistency described under Testing Coverage is an architecture/data-flow bug — two widgets on the same page independently compute "current DM%" with no shared source of truth.

Fixing one instance of a bug class while two siblings of the same class remain elsewhere (one live) is evidence the underlying discipline is real but not yet systemic. Score moves to 8/10 to reflect both the credit for the fix and the newly confirmed unfixed instances.

**What reaches 10/10:** Unchanged from last audit (Supabase/PostgreSQL migration, event sourcing/audit log for AI query history, `aggregateByBU` resolved) plus: apply the `getDashboardData()` fix pattern to `getStats()`, fix the `reconcile()` priority-order inversion, and give the `/dm-strategy` page a single shared DM% computation.

---

## Criterion 7: Developer Experience

**Score: 7/10** (was 8/10)

**Assessment:**
CLAUDE.md remains a genuinely strong onboarding document, and the enrichment CLI ergonomics (`--limit`, `--bu`) are unchanged and still good.

New negative, confirmed directly: the working tree currently contains 100+ untracked duplicate `" 2"`-suffixed source files spread across components, `src/lib`, API routes, and `data/enrichment` (e.g., `route 2.ts` next to `route.ts`, `opencorporates 2.ts` next to `opencorporates.ts`). Diffed examples are byte-identical to their originals today and none are tracked by git, so they're inert right now — but they're a real landmine for the next developer who edits the "real" file, doesn't notice its shadow copy, and later has that shadow silently reappear via an editor autosave or a bad merge. Beyond that, the repo root carries 38+ markdown files with overlapping/superseded content (`HANDOFF.md`, `HANDOFF_RESOLVED.md`, stale session-summary content), several untracked tooling directories of unclear purpose (`.agents/`, `.cortex/`, `.claude/skills/`, `skills-lock.json`), roughly nine loose screenshot PNGs at repo root, and a `.git` directory that has grown to ~196MB from committed binaries (the budget `.xlsx`, HTML dashboard exports). None of this blocks CLAUDE.md's documented workflow, but a new developer has to wade through it first. Score moves to 7/10.

**What reaches 10/10:** Unchanged (single-command setup, OpenAPI reference, seed script without the Excel dependency) plus: remove or `.gitignore` the untracked `" 2"` duplicate files, and consolidate/archive the 38+ root-level markdown files into a single current-status doc.

---

## Criterion 8: Production Readiness

**Score: 4/10** (was 6/10)

**Assessment:**
The 2026-05-08 assessment described this criterion's gaps in the abstract — no auth, SQLite, no error monitoring, no audit log, no platform-wide rate limit — as "infrastructure gaps, all with known solutions and estimated effort." An adversarial audit since then turned several of those abstractions into confirmed, concrete, exploitable findings, which is a materially worse picture than "known debt with a clear remediation plan":

- **Confirmed SOQL injection**: `src/lib/salesforce/sync.ts` builds a SOQL `LIKE` clause from user input using `accountName.replace(/'/g, "\\'")` — escaping quotes but not backslashes first, a textbook incomplete-blacklist bug (an input with a backslash immediately before a quote produces `\\'` in the final query, which most SOQL/SQL parsers read as an escaped backslash followed by an unescaped closing quote). The calling route, `POST /api/salesforce/sync/[accountName]`, has zero auth, zero Zod validation, and zero allow-listing on the decoded path segment before it reaches this function and two others that build SOQL the same way, plus three filesystem writes under `data/account-plans/`.
- **Confirmed unauthenticated, unrated-limited database wipe**: `POST /api/seed` unconditionally runs `subscription.deleteMany({})` then `customer.deleteMany({})` before reseeding — no auth check, no confirmation flag, no environment guard. Anyone with the URL can empty the production tables with a single request.
- **Confirmed unauthenticated information disclosure**: `GET /api/health` returns which secrets/integrations are configured (`anthropicKeyConfigured`, `newsApiKeyConfigured`, database URL presence) plus per-adapter health and cache stats to any caller.
- **Confirmed rate-limiter spoofing vector**: the per-IP rate limiter trusts the first `X-Forwarded-For` entry with no upstream-proxy verification, on top of the already-known in-memory-per-process limitation (doesn't share state across serverless instances/regions) — a determined caller can spoof the header to bypass limits entirely, not just exhaust one instance's window.
- **Confirmed missing controls on 4 more routes**: `/api/scenarios/conversation/[id]/refine` and `/compare` (Claude-backed, no rate limit); `/api/dm-strategy/accept-recommendation` and `/defer-recommendation` (DB-mutating, no rate limit, no schema validation).
- **Confirmed via `npm audit`**: 14 dependency vulnerabilities — 1 critical, 11 high, 1 moderate, 1 low — not yet triaged or patched.

None of this changes the underlying, deliberate "no auth yet" product decision — that's still a documented, on-hold call, not a defect. But the SOQL injection and the unauthenticated data-wipe endpoint in particular are not "infrastructure debt with an estimated fix" in the way the last audit framed this criterion — they are live, exploitable bugs that would fail any external security review today, on a platform that already handles confidential financial data. Score moves to 4/10.

**What reaches 10/10:** Fix the SOQL injection and add auth/allow-listing to the Salesforce sync route immediately — this is the one item here that reads as an active incident risk, not debt. Remove or environment-gate `/api/seed`. Apply `rateLimit()` + Zod uniformly to the remaining unvalidated routes. Then the original wishlist: Supabase + Row Level Security, SSO/SAML, Sentry, structured logging, per-authenticated-user rate limiting.

---

## Criterion 9: Documentation

**Score: 8/10** (was 9/10)

**Assessment:**
CLAUDE.md is still excellent by the same measure as the last audit — architecture map, 10+ documented patterns, testing commands with expected counts, environment variable table, known gotchas, financial glossary. PRODUCT.md, DESIGN.md, and WAITING_ON.md are unchanged and still good.

Set against that: the same repo-hygiene audit that lowered Developer Experience also confirmed 38+ overlapping/superseded markdown files at repo root (`HANDOFF.md`, `HANDOFF_RESOLVED.md`, stale session-summary content). That's a documentation-quality problem, not just a clutter problem — a document set this large with no clear "which of these is current" signal undercuts the credibility of the otherwise best-in-class CLAUDE.md, and it's the kind of thing that compounds every session it isn't cleaned up. Score moves to 8/10.

**What reaches 10/10:** Unchanged (OpenAPI reference, user-facing executive guide, video walkthrough) plus: consolidate or archive the 38+ overlapping root-level markdown files down to a single current-status doc per topic.

---

## Criterion 10: Velocity

**Score: 10/10** (unchanged)

**Assessment:**
Since the last audit, in the same high-velocity cadence, the team shipped: WCAG 2.2 hardening (47 findings), a Zod v4 migration that resolved 24 pre-existing tsc errors, a CI-blocking `package-lock.json` fix, a full budget-workbook refresh (Q1'26 → Q3'26) propagated through every script that reads it by filename, real per-BU financial metrics replacing hardcoded benchmarks, a genuine double-counting bug found and fixed in production dashboard code, BU-filtered account navigation wired end-to-end, a previously-dead "Accept" button wired to a real endpoint, and test fixtures updated for real account churn between quarters (British Telecommunications PLC exited the Q3'26 book; the current snapshot is 101 accounts across Cloudsense/Kandy/STL/NewNet, down from the previously-cited 140). All 4 open beads issues closed; 161/161 unit and 49/49 smoke tests still pass; CI still green.

Shipping a real correctness fix (the dashboard double-count) in the same cadence as feature and compliance work is exactly the kind of quality-under-velocity this criterion rewards, and it's why the score holds at 10 even though this same rescore lowered three other criteria based on what the same audit cadence surfaced elsewhere. Velocity measures throughput-with-quality, not the absence of remaining defects — those are scored under Type Safety and Production Readiness instead.

**What reaches 10/10:** Already at 10.

---

## Score Summary

| Criterion | Score (2026-05-08) | Score (2026-08-05) | Δ |
| --- | :---: | :---: | :---: |
| AI Integration Quality | 9/10 | 8/10 | ▼1 |
| Type Safety | 9/10 | 7/10 | ▼2 |
| Accessibility | 8/10 | 8/10 | — |
| Testing Coverage | 8/10 | 8/10 | — |
| Design System | 8/10 | 8/10 | — |
| Architecture | 9/10 | 8/10 | ▼1 |
| Developer Experience | 8/10 | 7/10 | ▼1 |
| Production Readiness | 6/10 | 4/10 | ▼2 |
| Documentation | 9/10 | 8/10 | ▼1 |
| Velocity | 10/10 | 10/10 | — |
| **Overall (simple average)** | **8.4/10** | **7.6/10** | **▼0.8** |

---

## Top 1% Verdict

**Conditionally — the engineering core is still top 1%, but this rescore is a downgrade, not a confirmation.**

Four criteria held flat (Accessibility, Testing Coverage, Design System, Velocity) and none of the ten improved enough to raise a score — the real financial-data wiring and the dashboard double-count fix are genuine quality investment, but they weren't enough to offset what an adversarial audit found elsewhere. Five criteria moved down, two of them by two full points each (Type Safety, Production Readiness), because audit evidence directly contradicted claims the previous assessment made at face value: "Zod schemas cover all 22 API routes" is false (3 confirmed counterexamples), and "infrastructure gaps... all with known solutions" undersold what turned out to be a confirmed SOQL injection and an unauthenticated endpoint that deletes the entire production database in one request.

**What still argues for top 1%:**

- ClaudeOrchestrator as first-class infrastructure, now fed by real (not hardcoded) financial data
- A genuine double-counting bug found and fixed in production dashboard code — real correctness auditing, not just feature output
- WCAG 2.2 hardening actually merged (PR #2)
- CLAUDE.md quality, unchanged and still exceptional
- Velocity: this scope of fixes and hardening, in this cadence, is still rare

**What blocks an unqualified verdict now:**

- A confirmed SOQL injection on an unauthenticated route — not debt, an active vulnerability
- A confirmed unauthenticated endpoint that unconditionally wipes the production database
- Confirmed gaps in the "Zod at every API entry point" claim, on routes that mutate the database or trigger paid Claude calls
- 14 unpatched npm vulnerabilities, including 1 critical, confirmed via `npm audit`
- The same bug *class* (revenue double-counting) confirmed present in a second, currently-dormant code path after being fixed in the first — suggesting the fix was local, not systemic

**The honest comparison:**
Most AI SaaS tools in 2025–2026 are thin wrappers around a model API with no semantic layer, no type safety, no meaningful tests, and generic UI. Skyvera still clears that bar by a wide margin — domain-specific semantic layer, 210+ tests, WCAG 2.2 hardening, a real design system, and a team that fixes bugs like the dashboard double-count when it finds them. But "top 1%" is a claim about the whole platform as shipped, and a platform with a confirmed SOQL injection and a one-request database-wipe endpoint cannot carry that label without qualification, regardless of how good the parts around it are. Close the Production Readiness findings above and re-run this assessment — that is very plausibly a 9+/10 platform once they're closed, not a rebuild.
