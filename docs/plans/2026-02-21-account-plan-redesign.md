# Account Plan Redesign — 2026-02-21

## Goal
Rebuild all account plan tab components to faithfully match `Telstra_Account_Plan_Interactive.html` as the pixel-level design reference. Every visual pattern maps 1:1 from the Telstra HTML.

## Design Reference Mappings

| Telstra HTML pattern | React equivalent |
|---|---|
| `.header` — gradient secondary→#1a2332, SVG grid overlay, glass stat cards | `page.tsx` hero — already close, minor refinements |
| `.nav-tabs` — white bg, sticky, border-bottom-2, overflow-x-auto | `tab-navigation.tsx` — verify renders horizontal on desktop |
| `.card` — white, border-border, hover lift + gradient top sweep | all tab cards |
| `.metric-box` — bg-highlight, border-left-3 accent, Cormorant value, DM Sans label | overview KPI cards, financials |
| `.data-table` — dark thead (bg-secondary, white, uppercase), border-collapse:separate | financials, strategy, competitive |
| `.badge` — border-radius 2px, uppercase, letter-spacing | all status badges |
| `.action-item` — border-left-4 accent, grid 1fr auto, strong title secondary | action-items tab |
| `.alert-banner` — gradient critical, border-left, shadow | overview critical alerts |
| `.timeline` — centred vertical line, alternating left/right | action-items 30/60/90 plan |
| `.decision-matrix` — 4-quadrant supporter/detractor grid | organization tab |
| `.org-node` — white card, border-secondary, inline-block, CEO node accented | organization tab |
| `.expandable` — clickable header with chevron, max-height animation | intelligence tab |
| `.footer` — bg-secondary, centred | page.tsx footer — already done |

## Design Tokens (already in globals.css — use everywhere)
- `var(--ink)` `var(--paper)` `var(--accent)` `var(--secondary)`
- `var(--muted)` `var(--border)` `var(--highlight)`
- `var(--success)` `var(--warning)` `var(--critical)`
- `font-display` class → Cormorant Garamond
- Body → DM Sans

## Files to Rebuild

1. `src/app/accounts/[name]/_components/tab-navigation.tsx` — verify sticky horizontal tabs, fix if mobile-only rendering
2. `src/app/accounts/[name]/_components/overview-tab.tsx` — alert banner, metric boxes for 90-day priorities, 2-col account status + risk/opportunity tables, KPI row
3. `src/app/accounts/[name]/_components/financials-tab.tsx` — subscription data table with dark thead, ARR metrics row, renewal timeline
4. `src/app/accounts/[name]/_components/strategy-tab.tsx` — pain points data table, opportunities table, expandable sections
5. `src/app/accounts/[name]/_components/competitive-tab.tsx` — competitive landscape table, advantages grid, competitive position cards
6. `src/app/accounts/[name]/_components/organization-tab.tsx` — stakeholder decision matrix (4-quadrant), org node cards
7. `src/app/accounts/[name]/_components/intelligence-tab.tsx` — expandable sections for intelligence report, news cards
8. `src/app/accounts/[name]/_components/action-items-tab.tsx` — action items list with border-left, 30/60/90 timeline, escalation triggers

## Architecture
- All components are Server Components except tab-navigation (client, uses useSearchParams)
- Action-items tab has a client sub-component for the drag-and-drop Kanban — preserve @dnd-kit
- recharts cannot use CSS vars in SVG props — use DESIGN_TOKENS constants if charts needed
- No new dependencies — use existing: lucide-react, recharts, @dnd-kit

## Constraints
- DO NOT change data fetching logic or types
- DO NOT change URL routing or tab IDs
- DO NOT remove the intelligence tab (not in Telstra but needed for AI-generated content)
- PRESERVE all existing props interfaces — only change JSX/styling
