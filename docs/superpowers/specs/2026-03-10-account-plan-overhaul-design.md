# Account Plan Overhaul — Design Spec
**Date:** 2026-03-10
**Branch:** fix/pr-review-hardening
**Reference:** `Telstra_Account_Plan_Interactive.html`

## Goal
Completely rebuild all account plan pages to match the visual quality, layout, and interactivity of the Telstra reference HTML. Every tab must feel like a premium, data-rich executive document — not a dashboard widget.

## Visual System
Exact match to Telstra HTML design tokens (already in globals.css):
- `--ink: #1a1a1a` / `--paper: #fafaf8` / `--accent: #c84b31` / `--secondary: #2d4263`
- `--highlight: #ecdbba` / `--border: #e8e6e1` / `--muted: #8b8b8b`
- Typography: `Cormorant Garamond` (display/values) + `DM Sans` (body)

### Component Patterns
- **Cards**: white bg, `1px solid var(--border)`, `box-shadow: 0 1px 3px rgba(0,0,0,0.04)`, hover → `translateY(-2px)` + accent gradient top-bar (`::before` scaleX animation)
- **Metric boxes**: `var(--highlight)` bg, `3px solid var(--accent)` left border, large Cormorant value
- **Tables**: `var(--secondary)` dark thead (white text, uppercase tracking), `var(--highlight)` hover rows, `border-bottom: 1px solid var(--border)` rows
- **Badges**: `border-radius: 2px`, `text-transform: uppercase`, `letter-spacing: 0.05em` — critical/high/medium/success/neutral variants
- **Nav tabs**: sticky top-0 z-100, white bg, `border-bottom: 2px solid var(--border)`, active tab `border-bottom: 3px solid var(--accent)` + `color: var(--accent)`
- **Expandable sections**: max-height CSS transition (0 → 3000px), chevron rotate animation
- **Timeline**: center `2px` vertical line, alternating odd/even items left/right, accent dot markers
- **Org nodes**: bordered cards with color-coded status borders, stacked levels

## 8-Tab Structure

### Tab 1: Overview
- Critical alert banner (red gradient) if health = red/yellow
- "Keys to Success" — 3 metric boxes (30/60/90 day priorities)
- 2-column: Account Status table + Risk & Opportunity summary
- 2 Recharts charts: ARR breakdown (doughnut) + Customer concentration (pie)

### Tab 2: Key Executives
- 4-quadrant decision matrix: Supporter-DM / Detractor-DM / Supporter-Influencer / Detractor-Influencer
- Expandable accordion per stakeholder (champion/decision-maker first, open by default)
  - Profile table (title, tenure, background)
  - Strategic context list
  - Key message highlight box (`var(--highlight)` bg, accent left border)
- Relationship actions table: Name · Title · Decision/Influence · Status · Next Action · Timeline badge

### Tab 3: Org Structure
- Description paragraph: "Decision-making hierarchy for [BU] systems"
- Visual org-node hierarchy: CEO level → C-suite level → operational level
  - `org-node` cards: `border: 2px solid var(--secondary)`, min-width 250px
  - CEO node: `border-color: var(--accent)`, accent gradient bg
  - Target nodes: `border-width: 3px`, `border-color: var(--success)`
  - Advocate nodes: green bg tint
- Decision Hierarchy numbered list (accent left border box)

### Tab 4: Pain Points
- 6-column table: Identified Pain · Customer Owner · Urgency badge · Budget badge · CloudSense Solution · Next Action badge
- High-severity rows: `rgba(229,57,53,0.08)` bg tint
- Strategic Initiatives section: 2×2 card grid with title, timeline/owner, description, relevance badge

### Tab 5: Competitive
- CPQ Competitors threat table: Competitor · Threat Level · Customer Sponsor · Risk · How We Differentiate · Next Action
- Competitive Advantages: metrics grid (6 boxes) with label/value/description
- Defensive Strategy: numbered ordered list in card
- Competitive Risk Timeline: Risk Event · Probability · Impact · Timing · Mitigation

### Tab 6: Action Plan
- Visual zigzag timeline: Days 1-30 · Days 31-60 · Days 61-90 · Critical deadline
  - Center vertical line, alternating left/right content cards
  - Accent dot marker on center line
- Detailed action items table: Action · Owner · Target/Outcome · Timeline · Priority badge · Status badge
- Key Messages by stakeholder: 2×2 grid of `var(--highlight)` boxes with accent left border
- Escalation Triggers: card with `border-left: 4px solid var(--critical)`, bulleted list

### Tab 7: Financial
- Contract/subscription table: Entity · Sub ID · Start Date · End Date · Current ARR · Projected ARR · Growth badge · Renewal
  - Total row: `var(--highlight)` bg, bold
- 2 Recharts charts: Revenue Growth Projection (bar) + Top Customers ARR (horizontal bar)
- Strategic Impact Analysis: 6 metric boxes (churn impact, % of BU, upsell opportunity, etc.)
- Expansion Opportunities table: Opportunity · Description · Revenue Potential · Probability badge · Timeline
- Company Overview: 2-col profile + investments tables

### Tab 8: Intelligence
- Existing data rebuilt with same card/table visual system (no raw markdown)
- Summary card with key message
- Opportunities: table with title · description · confidence badge · estimated value
- Risks: table with title · description · severity badge · mitigation
- Recommendations: expandable accordion cards
- News feed: card list with date, headline, source badge

## Chart Components (Recharts, `'use client'`)
- `src/components/charts/arr-breakdown-chart.tsx` — PieChart (doughnut via innerRadius)
- `src/components/charts/revenue-growth-chart.tsx` — BarChart (current vs projected ARR)
- `src/components/charts/top-customers-chart.tsx` — horizontal BarChart (top 10 by ARR)
All charts use brand colors: primary `#c84b31`, secondary `#2d4263`, accent `#ecdbba`

## Data Model Extensions
- `PainPoint` → `cloudSenseSolution?: string`, `nextAction?: string`
- `Competitor` → `threatLevel?: 'critical' | 'high' | 'medium' | 'low'`, `customerSponsor?: string`, `nextActionToDefend?: string`
- `Stakeholder` → `keyMessage?: string`
- `Subscription` → `startDate?: string`, `endDate?: string`, `projectedArr?: number`

## Files to Create
- `src/app/accounts/[name]/_components/key-executives-tab.tsx` (new)
- `src/app/accounts/[name]/_components/org-structure-tab.tsx` (new)
- `src/app/accounts/[name]/_components/pain-points-tab.tsx` (new)
- `src/app/accounts/[name]/_components/action-plan-tab.tsx` (new)
- `src/components/charts/arr-breakdown-chart.tsx` (new)
- `src/components/charts/revenue-growth-chart.tsx` (new)
- `src/components/charts/top-customers-chart.tsx` (new)

## Files to Modify
- `src/lib/types/account-plan.ts` — extend types
- `src/app/accounts/[name]/_components/tab-navigation.tsx` — 8 tabs
- `src/app/accounts/[name]/page.tsx` — route new tabs
- `src/app/accounts/[name]/_components/overview-tab.tsx` — add charts + risk summary
- `src/app/accounts/[name]/_components/financials-tab.tsx` — charts + contract + impact
- `src/app/accounts/[name]/_components/competitive-tab.tsx` — full rebuild
- `src/app/accounts/[name]/_components/intelligence-tab.tsx` — visual rebuild

## Files to Delete
- `src/app/accounts/[name]/_components/strategy-tab.tsx` (replaced by pain-points-tab)
- `src/app/accounts/[name]/_components/organization-tab.tsx` (replaced by key-executives + org-structure)
- `src/app/accounts/[name]/_components/action-items-tab.tsx` (replaced by action-plan-tab)

## Success Criteria
- All 8 tabs render with correct Telstra visual language
- Charts render correctly with account-specific data
- Expandable accordions animate smoothly
- Visual timeline renders on Action Plan tab
- Org nodes display hierarchy correctly
- No TypeScript errors
- Builds and deploys to Vercel successfully
