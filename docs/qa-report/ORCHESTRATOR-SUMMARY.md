# Orchestrator Summary — QA Fix Wave Planning
**Date:** 2026-02-19
**Source audits:** audit-agent-a.json, audit-agent-b.json, audit-agent-c.json

---

## Total Issue Count

| Severity | Count | Notes |
|----------|-------|-------|
| P0 (crash / broken link) | 2 | acct-000 (404 on British Telecommunications), pa-004 (broken /submit-request and /backlog links) |
| P1 (visual / functional regressions) | 35 | Includes 22 design token violations, 8 missing features, 3 layout issues, 2 typography violations |
| P2 (polish / consistency) | 22 | Includes loading skeleton tokens, minor layout delta vs reference |
| P3 (minor visual) | 4 | Unused imports, minor spacing/font-size deltas |
| **Total** | **63** | Across 13 pages + 8 shared components |

---

## Top 5 Highest-Impact Fixes

These are the fixes that will produce the most visible improvement across the most pages, ordered by visual impact per effort unit.

### 1. Wave 0 — Fix `.card-hover` + `.skeleton` in globals.css and token violations in `kpi-card.tsx` + `health-indicator.tsx` (W0-001 through W0-005)
**Why:** These 5 fixes affect EVERY page in the app. The `.card-hover` 4px lift is more aggressive than the Telstra reference's 2px lift and applies to all Cards across all 13 pages. The `health-indicator.tsx` green dot is the only shared component with a raw Tailwind colour (`bg-green-500`) while the other two states already use tokens — it is a one-line fix with broad reach. KPICard colour fixes improve the dashboard header instantly. The Card component `::before` sweep animation adds the hover micro-interaction that the Telstra reference defines and that currently no page has.

### 2. Wave 2 — Dashboard structural fixes: remove outer gradient wrapper, white card shell, and font overrides (W2-D-001 through W2-D-003)
**Why:** The `/dashboard` is the landing page of the app (root redirects to it). It currently looks completely different from all other pages due to three nested structural issues: a blue gradient outer shell, a white floating card inside it, and system-font override on the h1. Fixing these three issues will make the dashboard visually consistent with the rest of the app in a single pass and is the most impactful structural change in Wave 2.

### 3. Wave 2 — Scenario component token replacement (W2-S-001, W2-S-002)
**Why:** `conversational-scenario.tsx` has the largest single-file concentration of design token violations in the entire codebase — 20+ distinct class replacements required. The scenario page is a primary user-facing feature. Fixing these will visually unify the scenario chat interface with the editorial theme and is the most comprehensive single-component token fix in the project.

### 4. Wave 1 — P0: Fix British Telecommunications 404 (W1-P0-001 / acct-000)
**Why:** The entire account plan feature is non-functional for at least one real account (British Telecommunications). Since the Playwright test confirmed a hard 404, the page cannot be demoed or reviewed. Fixing the name-matching/normalization in the data lookup restores the core account plan feature.

### 5. Wave 3 — Remove /dm-strategy `:root` parallel token system (W3-DM-001)
**Why:** The independent `:root` block in `dm-strategy/styles.css` creates a conflicting CSS custom property system that overrides globals.css tokens inside dm-strategy components. This is the root cause of 6 downstream issues in dm-strategy (dm-001 through dm-005, trends-001 through trends-004). Fixing the `:root` block first makes all subsequent dm-strategy token replacements straightforward.

---

## Pages with P0 Issues

| Page | P0 Issue | Issue ID |
|------|----------|----------|
| `/accounts/[name]` | 404 crash for "British Telecommunications" — account plan route non-functional | acct-000 |
| `/product-agent` | Two `<Link>` buttons point to non-existent routes (`/product-agent/submit-request`, `/product-agent/backlog`) — hard 404 on click | pa-004 |

---

## Key Shared Component Issues that Block Page Fixes

These shared component issues in Wave 0 must be resolved before Wave 1/2/3 agents begin, because:

1. **`health-indicator.tsx` `bg-green-500` (W0-002):** The HealthIndicator is used in the accounts list (the filter buttons reference it) and in the account plan hero subtitle. Wave 1 and Wave 2 both touch pages that use this component. If Wave 0 does not fix it first, Wave 1/2 agents would need to duplicate the fix or skip it.

2. **`globals.css` `.card-hover` translateY(-4px) (W0-003):** The Card component, which is used on virtually every page, applies `card-hover` by default. Wave 1 agents working on account plan cards, and Wave 2 agents working on dashboard/accounts/alerts/query/scenario cards, will all be affected by this value. Fixing it in Wave 0 ensures a consistent result without each wave agent having to independently override the animation.

3. **`card.tsx` missing `::before` sweep animation (W0-005):** The Telstra reference defines this animation for all cards. Adding it to the shared Card component means every tab in the account plan and every dashboard card gets it automatically. If Wave 1 agents try to add it per-component, they will create duplicate implementations that Wave 0's central fix would then conflict with.

4. **`kpi-card.tsx` hardcoded hex colours (W0-001):** The KPICard is used directly in the dashboard header gradient section. The dashboard page itself has structural issues (Wave 2), but the KPICard colour tokens should be canonical before Wave 2 agents work on surrounding elements.

---

## Deferred Issues and Why

| Deferred Issue | Why Deferred |
|----------------|-------------|
| Account plan Overview + Financial charts (acct-007, acct-020) | Requires chart library standardisation decision (recharts vs Chart.js) and confirmed data shape from subscriptions/revenue model. This is a feature build, not a defect fix. |
| Key Executives 2×2 decision matrix (acct-012) | Requires `supporterOrDetractor` field added to the Stakeholder data type AND populated in the data layer. Cannot be rendered without data. |
| Pain point extended data model (acct-014): budget, solution, nextAction fields | Data model extension required in the data source before the 6-column table can display real values. |
| Competitive extended data model (acct-016): threatLevel, customerSponsor, risk, differentiation, nextAction | Same as above. |
| Live trends data connection (trends-005) | Requires a new real data provider function for `/dm-strategy/trends`. Currently only static demo data exists. |
| Product/policy decision on test pages (ta-004, demo-003) | Whether `/product-agent/test-analysis` and `/dm-strategy/demo` should be internal developer tools or user-facing features requires a product decision. The code fix (access gating) is straightforward once the decision is made. |
| British Telecommunications name resolution — if data issue (acct-000 partial) | If investigation reveals the customer literally does not exist in the dataset (vs. a name normalisation bug), the fix is in the data layer, not the UI. The Wave 1 agent must investigate and escalate if it is a data issue. |

---

## Estimated Complexity Per Wave

| Wave | Complexity | Rationale |
|------|-----------|-----------|
| **Wave 0** | Simple–Medium | 5 targeted fixes across 3 files. The Card `::before` animation addition is the most involved (adding a child element and `group` class). All other changes are direct class/property replacements. Estimated effort: 1–2 hours. |
| **Wave 1** | Complex | 30 issues across 12+ files in the account plan route. Includes P0 investigation, structural tab splitting (Key Executives / Org Structure), multiple missing feature implementations (timeline, escalation triggers, key messages), and data model extensions (deferred). Pure styling fixes are simple; the feature additions are complex. Estimated effort: 2–3 days for the full wave including non-deferred items. |
| **Wave 2** | Medium | 20 issues across 8 pages/files. Mostly design token replacements and structural clean-ups (remove dashboard gradient wrappers). The Suspense boundary fix (dash-007) and alert grid layout (alrt-002) require some functional testing. Estimated effort: 4–6 hours. |
| **Wave 3** | Medium–Complex | 17 issues across 6+ files in dm-strategy and product-agent routes. The parallel token system removal (W3-DM-001) is the highest-risk item (must audit all `var(--primary-blue)` / `var(--accent-cyan)` consumers before removing `:root`). Recharts colour token limitation (W3-DM-005) requires a design token constants file. Demo/test page gating requires environment checks. Estimated effort: 6–8 hours. |

---

## Wave Execution Order

```
Wave 0 (shared components) ──► commit
                                │
              ┌─────────────────┴──────────────────┐
              ▼                                     ▼
        Wave 1 (account plan)             Wave 2 (core pages)
        [run parallel]                    [run parallel]
              │                                     │
              └─────────────────┬──────────────────┘
                                ▼
                         Wave 3 (newer pages)
                         [runs after both 1 + 2]
```

All waves must respect the DO NOT TOUCH list for `src/components/ui/*.tsx` and `src/app/globals.css` — those are owned exclusively by Wave 0.
