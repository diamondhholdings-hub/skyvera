# QA, Bugfix & Visual Design Improvement — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Systematically audit all 13 pages across 8 routes, identify every visual and functional issue, then fix them in priority order using parallel agents — with `Telstra_Account_Plan_Interactive.html` as the explicit design reference for account plan pages.

**Architecture:** Three tiers — parallel audit agents produce JSON reports → orchestrator synthesizes into a Fix Manifest → parallel fix agents resolve issues with strict file ownership boundaries.

**Tech Stack:** Next.js 15, Playwright, Tailwind CSS, CSS custom properties (`globals.css`), `src/components/ui/` shared component library, reference HTML files at project root.

---

## Pre-flight Checklist

Before running any task, verify:
- [ ] Dev server is running at `http://localhost:3000` (`npm run dev` in project root)
- [ ] Playwright is installed (`npx playwright install chromium`)
- [ ] Output directories exist: `mkdir -p docs/qa-report tests/screenshots`

---

## Task 1: Create Screenshot Utility Script

**Files:**
- Create: `tests/utils/screenshot-all-pages.ts`

**Step 1: Write the screenshot script**

```typescript
// tests/utils/screenshot-all-pages.ts
// Run with: npx tsx tests/utils/screenshot-all-pages.ts
import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:3000'

const PAGES = [
  { route: '/',                           name: 'root' },
  { route: '/dashboard',                  name: 'dashboard' },
  { route: '/accounts',                   name: 'accounts' },
  { route: '/accounts/British%20Telecommunications', name: 'account-plan-bt' },
  { route: '/alerts',                     name: 'alerts' },
  { route: '/query',                      name: 'query' },
  { route: '/scenario',                   name: 'scenario' },
  { route: '/dm-strategy',                name: 'dm-strategy' },
  { route: '/dm-strategy/demo',           name: 'dm-strategy-demo' },
  { route: '/dm-strategy/trends',         name: 'dm-strategy-trends' },
  { route: '/product-agent',              name: 'product-agent' },
  { route: '/product-agent/test-analysis', name: 'product-agent-test-analysis' },
  { route: '/test-dm-tracker',            name: 'test-dm-tracker' },
]

async function screenshotAll() {
  const outDir = 'tests/screenshots'
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

  for (const p of PAGES) {
    const page = await context.newPage()
    try {
      await page.goto(`${BASE_URL}${p.route}`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.screenshot({
        path: path.join(outDir, `${p.name}.png`),
        fullPage: true,
      })
      console.log(`✓ ${p.name}`)
    } catch (err) {
      console.error(`✗ ${p.name}: ${err}`)
      // Write error marker
      fs.writeFileSync(path.join(outDir, `${p.name}.ERROR.txt`), String(err))
    } finally {
      await page.close()
    }
  }

  await browser.close()
  console.log(`\nScreenshots saved to ${outDir}/`)
}

screenshotAll()
```

**Step 2: Run it to confirm all pages load**

```bash
npx tsx tests/utils/screenshot-all-pages.ts
```

Expected: 13 `✓` lines. Any `✗` lines = P0 crash issues. Note which pages error.

**Step 3: Commit**

```bash
git add tests/utils/screenshot-all-pages.ts
git commit -m "chore: add screenshot utility for QA audit"
```

---

## Task 2: Tier 1 — Dispatch 3 Parallel Audit Agents

> **REQUIRED SUB-SKILL:** Use `superpowers:dispatching-parallel-agents` to dispatch all three agents simultaneously.

Each agent reads source code + screenshots and produces a JSON report. Dispatch all three at once.

---

### Agent A Prompt — Core Pages Audit

```
You are a QA audit agent for the Skyvera BI Platform. Your job is to audit 6 core pages and produce a structured JSON issue report. Do NOT fix anything — audit only.

## Your pages
- `/` (root landing)
- `/dashboard`
- `/accounts`
- `/alerts`
- `/query`
- `/scenario`

## What to audit for each page

1. **Read the page source**: Read the page.tsx and all component files under that route
2. **Check screenshots**: Screenshots are at `tests/screenshots/{page-name}.png` — read them and visually assess
3. **Check for crashes**: Any `.ERROR.txt` file at `tests/screenshots/{name}.ERROR.txt` means the page crashed
4. **Check against design system**: The design system uses CSS custom properties defined in `src/app/globals.css`:
   - `--ink: #1a1a1a` (text), `--paper: #fafaf8` (background), `--accent: #c84b31` (red), `--secondary: #2d4263` (navy)
   - Typography: Cormorant Garamond for display headings, DM Sans for body
   - Gradient headers: `bg-gradient-to-br from-[var(--secondary)] to-[#1a2332]`
5. **Check shared components**: `src/components/ui/nav-bar.tsx`, `src/app/layout.tsx`

## Issues to look for
- Pages that crash or show error boundaries instead of content
- Missing gradient headers (dashboard and accounts should have them)
- Wrong typography (generic Tailwind text-* instead of editorial tokens)
- Navigation items missing or broken
- Data not rendering (empty sections that should have data)
- Color inconsistencies (generic blue/slate instead of --accent/--secondary)
- Layout broken at 1440px viewport
- Loading states that never resolve
- Any console errors visible in components

## Output format

Write your report to: `docs/qa-report/audit-agent-a.json`

```json
{
  "agent": "A",
  "pages": [
    {
      "page": "/dashboard",
      "screenshot": "tests/screenshots/dashboard.png",
      "crashed": false,
      "issues": [
        {
          "id": "dash-001",
          "severity": "P0 | P1 | P2",
          "type": "crash | visual | functional | design",
          "description": "Exact description of what is wrong",
          "files_affected": ["src/app/dashboard/components/revenue-chart.tsx"],
          "shared_component": false,
          "fix_approach": "Brief description of how to fix"
        }
      ]
    }
  ]
}
```

Severity:
- P0 = page crashes, data doesn't load, broken interaction
- P1 = visual drift from design system, layout broken, wrong typography
- P2 = polish (spacing off, hover state missing, minor inconsistency)

Be thorough. If a page looks fine, still report it with an empty issues array.
```

---

### Agent B Prompt — Account Plan Audit (Telstra Reference)

```
You are a QA audit agent for the Skyvera BI Platform. Your job is to audit the account plan page `/accounts/[name]` against the Telstra reference design and produce a structured JSON issue report. Do NOT fix anything — audit only.

## Your page
- `/accounts/[name]` (e.g. `/accounts/British%20Telecommunications`)
- Screenshot: `tests/screenshots/account-plan-bt.png`

## Source files to read
- `src/app/accounts/[name]/page.tsx`
- `src/app/accounts/[name]/_components/tab-navigation.tsx`
- `src/app/accounts/[name]/_components/overview-tab.tsx`
- `src/app/accounts/[name]/_components/financials-tab.tsx`
- `src/app/accounts/[name]/_components/organization-tab.tsx`
- `src/app/accounts/[name]/_components/strategy-tab.tsx`
- `src/app/accounts/[name]/_components/competitive-tab.tsx`
- `src/app/accounts/[name]/_components/intelligence-tab.tsx`
- `src/app/accounts/[name]/_components/action-items-tab.tsx`
- `src/app/accounts/[name]/_components/stakeholder-card.tsx`
- `src/app/accounts/[name]/_components/retention-tab.tsx`

## Reference design
Read `Telstra_Account_Plan_Interactive.html` carefully. This is the EXACT design target.

Key elements to compare:
1. **Hero header** — gradient background with account name, stat cards (ARR, Health, etc.)
2. **Tab navigation** — 7 tabs with emoji labels, sticky on scroll, accent underline for active
3. **Overview tab** — conditional critical alert banner for at-risk accounts, Keys to Success cards
4. **Organization tab** — exec-card pattern: accent left border (4px), uppercase role label, serif name
5. **Strategy tab** — pain points, opportunities, competitive context
6. **Action Items tab** — Kanban board with @dnd-kit drag-and-drop
7. **Typography** — Cormorant Garamond for names/headings (font-display class), DM Sans for body
8. **Colors** — accent #c84b31, secondary #2d4263, paper #fafaf8

For each tab, compare the screenshot against the Telstra reference and note every visual difference.

## Output format

Write your report to: `docs/qa-report/audit-agent-b.json`

```json
{
  "agent": "B",
  "reference": "Telstra_Account_Plan_Interactive.html",
  "pages": [
    {
      "page": "/accounts/[name]",
      "screenshot": "tests/screenshots/account-plan-bt.png",
      "crashed": false,
      "issues": [
        {
          "id": "acct-001",
          "severity": "P0 | P1 | P2",
          "type": "crash | visual | functional | design",
          "tab": "overview | financials | organization | strategy | competitive | intelligence | action-items | hero | navigation",
          "description": "Exact description compared to Telstra reference",
          "files_affected": ["src/app/accounts/[name]/_components/overview-tab.tsx"],
          "shared_component": false,
          "telstra_reference": "What the Telstra HTML does that we don't"
        }
      ]
    }
  ]
}
```
```

---

### Agent C Prompt — Newer Pages Audit

```
You are a QA audit agent for the Skyvera BI Platform. Your job is to audit the newer pages and produce a structured JSON issue report. Do NOT fix anything — audit only.

## Your pages
- `/dm-strategy` (screenshot: `tests/screenshots/dm-strategy.png`)
- `/dm-strategy/demo` (screenshot: `tests/screenshots/dm-strategy-demo.png`)
- `/dm-strategy/trends` (screenshot: `tests/screenshots/dm-strategy-trends.png`)
- `/product-agent` (screenshot: `tests/screenshots/product-agent.png`)
- `/product-agent/test-analysis` (screenshot: `tests/screenshots/product-agent-test-analysis.png`)
- `/test-dm-tracker` (screenshot: `tests/screenshots/test-dm-tracker.png`)

## Source files to read
For dm-strategy:
- `src/app/dm-strategy/page.tsx`
- `src/app/dm-strategy/styles.css`
- `src/app/dm-strategy/components/` (all files)
- `src/app/dm-strategy/demo/page.tsx`
- `src/app/dm-strategy/trends/page.tsx`
- `src/app/dm-strategy/README.md`
- `src/app/dm-strategy/COMPONENT_GUIDE.md`

For product-agent:
- `src/app/product-agent/page.tsx`
- `src/app/product-agent/test-analysis/page.tsx`

For test-dm-tracker:
- `src/app/test-dm-tracker/page.tsx`

## Design system to check against
- CSS custom properties in `src/app/globals.css`: --ink, --paper, --accent, --secondary, --border
- Does dm-strategy use its own `styles.css` instead of the shared design system? This is a P1 issue.
- Navigation: All pages should have the shared `NavBar` from `src/components/ui/nav-bar.tsx`
- Typography: Cormorant Garamond (font-display class) for headings, DM Sans for body

## Issues to look for
- Pages that crash or show error states
- Pages using their own custom CSS instead of the shared design system tokens
- Missing navigation bar
- Functional features that don't work
- Content that doesn't render
- Pages that look like dev/test pages that shouldn't be user-facing

## Output format

Write your report to: `docs/qa-report/audit-agent-c.json`

```json
{
  "agent": "C",
  "pages": [
    {
      "page": "/dm-strategy",
      "screenshot": "tests/screenshots/dm-strategy.png",
      "crashed": false,
      "issues": [
        {
          "id": "dm-001",
          "severity": "P0 | P1 | P2",
          "type": "crash | visual | functional | design",
          "description": "Exact description of the issue",
          "files_affected": ["src/app/dm-strategy/page.tsx"],
          "shared_component": false,
          "fix_approach": "Brief description of how to fix"
        }
      ]
    }
  ]
}
```
```

**Step: Create output directory before dispatching**

```bash
mkdir -p docs/qa-report
```

**Step: Confirm all 3 reports were written**

```bash
ls docs/qa-report/audit-agent-*.json
```

Expected: 3 files — `audit-agent-a.json`, `audit-agent-b.json`, `audit-agent-c.json`

---

## Task 3: Tier 2 — Orchestrator Agent

> Dispatch ONE orchestrator agent after all 3 audit reports exist.

### Orchestrator Prompt

```
You are the orchestrator for the Skyvera QA process. Three audit agents have produced reports. Your job is to:

1. Read all three audit reports:
   - `docs/qa-report/audit-agent-a.json` (core pages)
   - `docs/qa-report/audit-agent-b.json` (account plans)
   - `docs/qa-report/audit-agent-c.json` (newer pages)

2. Read the current shared component files to understand what's shared:
   - `src/app/globals.css`
   - `src/app/layout.tsx`
   - `src/components/ui/nav-bar.tsx`
   - `src/components/ui/card.tsx`
   - `src/components/ui/kpi-card.tsx`
   - `src/components/ui/health-indicator.tsx`
   - `src/components/ui/badge.tsx`

3. Identify issues that affect shared components (any issue where `shared_component: true` OR where the same component appears in 2+ page reports).

4. Produce a Fix Manifest at `docs/qa-report/fix-manifest.md` in this exact format:

---
# Fix Manifest — 2026-02-19

## Summary
- Total issues found: N
- P0 (crashes): N
- P1 (visual/functional): N
- P2 (polish): N

## Wave 0: Shared Component Fixes (DO FIRST)
Issues affecting globals.css, layout.tsx, or any src/components/ui/* file.
All page fix agents must wait for Wave 0 to complete before running.

| ID | Severity | File | Description |
|----|----------|------|-------------|
| ... | ... | ... | ... |

**DO NOT TOUCH list for all subsequent agents:**
- `src/app/globals.css` (owned by Wave 0)
- `src/app/layout.tsx` (owned by Wave 0)
- `src/components/ui/*.tsx` (owned by Wave 0)

## Wave 1: Account Plan Fixes
Uses Telstra_Account_Plan_Interactive.html as reference. Runs in parallel with Wave 2.

| ID | Severity | Tab | File | Description |
|----|----------|-----|------|-------------|
| ... | ... | ... | ... | ... |

## Wave 2: Core Page Fixes
Runs in parallel with Wave 1. Each page agent only touches its own files.

### /dashboard
| ID | Severity | File | Description |
...

### /accounts
...

### /alerts
...

### /query
...

### /scenario
...

### / (root)
...

## Wave 3: Newer Page Fixes
Runs after Wave 1 and Wave 2 complete (in case of shared component dependency).

### /dm-strategy
...

### /product-agent
...

## Skipped / Out of Scope
- test-dm-tracker (test page, not user-facing)
---

5. Write a summary to `docs/qa-report/ORCHESTRATOR-SUMMARY.md`:
   - Total issue count by severity
   - Which pages have P0 issues (need immediate attention)
   - Top 3 highest-impact fixes
   - Estimated complexity per wave

Commit both files:
```bash
git add docs/qa-report/fix-manifest.md docs/qa-report/ORCHESTRATOR-SUMMARY.md
git commit -m "docs: add QA fix manifest from orchestrator synthesis"
```
```

---

## Task 4: Wave 0 — Shared Component Fix Agent

> Dispatch ONE agent. All page fix agents wait until this completes and is committed.

### Shared Component Fix Agent Prompt

```
You are the shared component fix agent for the Skyvera BI Platform QA process.

Read the Fix Manifest: `docs/qa-report/fix-manifest.md`
Execute ONLY the issues listed under "Wave 0: Shared Component Fixes".

## Files you may touch
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/ui/nav-bar.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/kpi-card.tsx`
- `src/components/ui/health-indicator.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/empty-state.tsx`
- `src/components/ui/refresh-button.tsx`

## Files you MUST NOT touch
Everything else. No page-specific files.

## Process for each issue
1. Read the affected file
2. Make the minimal fix
3. Commit after each fix: `git commit -m "fix(shared): [description]"`

## After all Wave 0 fixes
Run: `npx tsx tests/utils/screenshot-all-pages.ts`
Confirm no new regressions introduced.
```

---

## Task 5: Wave 1 + Wave 2 — Parallel Page Fix Agents

> **REQUIRED SUB-SKILL:** Use `superpowers:dispatching-parallel-agents` to dispatch Wave 1 and Wave 2 agents simultaneously.

Dispatch immediately after Wave 0 is committed.

---

### Wave 1 Agent Prompt — Account Plan Fix

```
You are the account plan fix agent for the Skyvera BI Platform.

## Context
Read these files first:
- `docs/qa-report/fix-manifest.md` — find the "Wave 1: Account Plan Fixes" section
- `Telstra_Account_Plan_Interactive.html` — this is your design reference
- `tests/screenshots/account-plan-bt.png` — current state

## Files you may touch (account plan only)
- `src/app/accounts/[name]/page.tsx`
- `src/app/accounts/[name]/_components/*.tsx` (all tab components)
- `src/app/accounts/[name]/loading.tsx`
- `src/app/accounts/[name]/error.tsx`

## Files you MUST NOT touch (owned by other agents)
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/ui/*.tsx`
- Any file outside `src/app/accounts/[name]/`

## Design target
The Telstra_Account_Plan_Interactive.html file is your pixel reference. For each issue in Wave 1:
1. Read the Telstra HTML to understand exactly what the target looks like
2. Read the current component file
3. Apply the minimal change to match the reference
4. Commit: `git commit -m "fix(account-plan): [description]"`

## After all fixes
Take a new screenshot and visually confirm improvements:
```bash
npx tsx tests/utils/screenshot-all-pages.ts
```
```

---

### Wave 2 Agent Prompt — Core Pages Fix

```
You are the core pages fix agent for the Skyvera BI Platform.

## Context
Read: `docs/qa-report/fix-manifest.md` — find the "Wave 2: Core Page Fixes" section

## Files you may touch (core pages only)
- `src/app/page.tsx` (root)
- `src/app/dashboard/page.tsx` and `src/app/dashboard/components/*.tsx`
- `src/app/accounts/page.tsx` and `src/app/accounts/components/*.tsx`
- `src/app/alerts/page.tsx` and `src/app/alerts/components/*.tsx`
- `src/app/query/page.tsx` and any query components
- `src/app/scenario/page.tsx` and any scenario components

## Files you MUST NOT touch
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/ui/*.tsx`
- Anything under `src/app/accounts/[name]/` (owned by Wave 1 agent)
- Anything under `src/app/dm-strategy/` or `src/app/product-agent/` (owned by Wave 3)

## Design system reference
All pages should use these CSS custom properties from globals.css:
- Text: `text-[var(--ink)]`, Background: `bg-[var(--paper)]`
- Gradient headers: `bg-gradient-to-br from-[var(--secondary)] to-[#1a2332] text-[var(--paper)]`
- Accent: `var(--accent)` (#c84b31), Secondary: `var(--secondary)` (#2d4263)
- Font display (headings/metrics): `font-display` class = Cormorant Garamond

## Process
For each issue in Wave 2:
1. Read the affected file
2. Fix the minimal thing
3. Commit: `git commit -m "fix(core-pages): [description of page and fix]"`
```

---

## Task 6: Wave 3 — Newer Pages Fix Agent

> Dispatch after Wave 1 and Wave 2 are complete.

### Wave 3 Agent Prompt — Newer Pages Fix

```
You are the newer pages fix agent for the Skyvera BI Platform.

## Context
Read: `docs/qa-report/fix-manifest.md` — find the "Wave 3: Newer Page Fixes" section
Read: `src/app/dm-strategy/README.md` and `src/app/dm-strategy/COMPONENT_GUIDE.md`

## Files you may touch
- `src/app/dm-strategy/page.tsx`
- `src/app/dm-strategy/styles.css`
- `src/app/dm-strategy/components/*.tsx`
- `src/app/dm-strategy/demo/page.tsx`
- `src/app/dm-strategy/trends/page.tsx`
- `src/app/product-agent/page.tsx`
- `src/app/product-agent/test-analysis/page.tsx`

## Files you MUST NOT touch
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/ui/*.tsx`

## Key concern: Design system alignment
dm-strategy has its own `styles.css`. Check if it conflicts with or duplicates the shared design system.
If dm-strategy defines its own colors/typography that conflict with --ink/--paper/--accent/--secondary,
migrate those to use the CSS custom properties instead.

## Process
For each issue:
1. Read the affected file
2. Fix the minimal thing
3. Commit: `git commit -m "fix(newer-pages): [description]"`
```

---

## Task 7: Final Verification Pass

**Step 1: Take final screenshots of all pages**

```bash
npx tsx tests/utils/screenshot-all-pages.ts
```

**Step 2: Run existing E2E smoke tests**

```bash
npx playwright test tests/smoke/ --reporter=list
```

Expected: All smoke tests pass.

**Step 3: Write QA completion report**

Create `docs/qa-report/2026-02-19-qa-audit.md` summarizing:
- Issues found per page (from fix-manifest.md)
- Issues resolved (cross-reference with git log)
- Any issues deferred (P2 items not fixed)
- Before/after screenshot file paths

**Step 4: Commit final report**

```bash
git add docs/qa-report/
git commit -m "docs: complete QA audit report with all fixes documented"
```

---

## File Ownership Map (Reference for All Agents)

| Wave | Agent | Owns |
|------|-------|------|
| 0 | Shared | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*` |
| 1 | Account Plan | `src/app/accounts/[name]/**` |
| 2 | Core Pages | `src/app/page.tsx`, `src/app/dashboard/**`, `src/app/accounts/page.tsx`, `src/app/accounts/components/**`, `src/app/alerts/**`, `src/app/query/**`, `src/app/scenario/**` |
| 3 | Newer Pages | `src/app/dm-strategy/**`, `src/app/product-agent/**` |

---

## Reference Files

| File | Purpose |
|------|---------|
| `Telstra_Account_Plan_Interactive.html` | Account plan design reference |
| `Skyvera_Financial_Dashboard_Q126.html` | Dashboard design reference |
| `Customer_Analysis_Dashboard.html` | Accounts page design reference |
| `src/app/globals.css` | CSS design tokens (--ink, --paper, --accent, etc.) |
| `src/components/ui/` | Shared component library |
