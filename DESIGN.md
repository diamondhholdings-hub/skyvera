---
version: 2
name: Skyvera
description: Light, neutral product UI for board-facing financial data. One sans family with tabular figures, true-white surfaces separated by hairline borders, brick red reserved for primary actions and the active nav item.
---

# Design System: Skyvera

## Scene

A CFO on a 14-inch laptop in a bright meeting room, five minutes before a board update, copying one number into a white slide deck. Everything follows from that: light theme, white surfaces, figures that read instantly and screenshot cleanly, nothing decorative competing with the number.

## Principles

1. **The data is the design.** No hero bands, gradients, glass, glow, grid overlays, or decorative illustration. The first thing with visual weight on any page is a figure or a table.
2. **Earned familiarity.** Standard product patterns (top nav, page header, tabs, tables, segmented filters). It should feel like Linear or Stripe's dashboard: the tool disappears into the task.
3. **AI is a feature, not a personality.** Never label things "AI-powered", "intelligent", "smart". No sparkle icons, no robot/brain emoji, no "NEW" badges on AI modes. Describe what a feature does ("Ask a question about the budget"), not how it is built.
4. **Color means state.** Brick red = primary action / active nav. Status colors = status only, always with an icon or a word.

## Hard bans (from Todd, 2026-10-21) — never ship any of these

- Cream or off-white page/section backgrounds (page is white `--paper`; `--surface-2` is only for table headers, toolbars, small wells)
- Italic accent words in headings (no `<em>`/`<i>`/italic in any heading)
- Numbered section labels like 01 / 02 / 03 or "#1 PRIORITY"
- Monospace anywhere, including labels and figures (use `.num` = tabular sans)
- Pill-shaped buttons or chips (`rounded-full` / 9999px only for status dots and avatars)

## Also banned (system rules)

- Side-stripe borders: `border-left`/`border-right` > 1px as a colored accent. Use a full 1px border, a tinted background, or a leading status icon.
- Tracked uppercase micro-labels (`text-transform: uppercase` + letter-spacing). Labels are sentence case, 12–13px, weight 500, `--muted`.
- Emoji in UI (tabs, headings, labels, buttons). Use a lucide-react icon if an icon is genuinely needed; most of the time, use nothing.
- Hardcoded hex/rgb colors in components. Use the CSS variables below.
- Gradient text, gradient backgrounds, backdrop-filter blur, glowing box-shadows.
- Identical icon+heading+text card grids; nested cards.
- Entrance animations / count-ups. Transitions 150–200ms on hover/focus/state only.
- Em dashes in UI copy.

## Color tokens (globals.css, OKLCH)

| Token | Use |
|---|---|
| `--ink` | primary text, figures |
| `--ink-2` | secondary text that must stay readable |
| `--muted` | labels, captions, helper text |
| `--paper` / `--surface` | page and panel background (white) |
| `--surface-2` | table header row, toolbars, segmented control track, empty-state well |
| `--surface-3` | pressed states, dividers on surface-2 |
| `--border` / `--border-strong` | hairlines; inputs and buttons use `--border-strong` |
| `--highlight` | row hover / selected row |
| `--accent`, `--accent-hover`, `--accent-tint` | primary button, active nav/tab underline, focus ring |
| `--secondary`, `--secondary-tint` | links, primary data series in charts |
| `--success/-tint/-ink`, `--warning/-tint/-ink`, `--critical/-tint/-ink` | status. Text on white uses the `-ink` variant; tinted fills use `-tint` |

Charts: series 1 `--secondary`, series 2 `--accent`, then `--muted`; status-coded charts use the status `-ink` colors. Read CSS vars at runtime in client chart code via `getComputedStyle(document.documentElement).getPropertyValue('--secondary')` if a hex is required; otherwise pass `var(--x)` where the library accepts CSS colors.

## Typography

One family: Inter (via next/font, `--font-body`). `--font-display` and `--font-mono` are aliases to it.

| Role | Size / weight |
|---|---|
| Page title (h1, via `PageHeader`) | 26px / 600 |
| Section heading (h2) | 18px / 600 |
| Panel heading (h3) | 16px / 600 |
| Body | 14px / 400, line-height 1.55 |
| Label / caption | 13px or 12px / 500, `--muted`, sentence case |
| KPI figure | 22px / 600, `.num` |
| Table figure | 14px, `.num`, right-aligned |

Every number gets `className="num"` (tabular-nums). Currency/percent columns right-align.

## Layout

- Container: `mx-auto max-w-[1400px] px-4 lg:px-8`.
- Page = `<PageHeader title subtitle action>` (optionally with a `<KpiStrip>` as children), then content with `py-6`, sections separated by `gap-6`/`space-y-8`.
- Group related content in a bordered panel (`.card`, 8px radius, 1px `--border`, padding 20px). Panel title row: h2/h3 left, actions right, 1px bottom border when the panel holds a table.
- Prefer tables (`.data-table`) for lists of accounts, BUs, figures. Wrap every table in `<div className="overflow-x-auto">`.
- Section navigation: underline tabs (`.dashboard-tab` + `aria-current="page"`), on white, no tinted bar.
- Filters / mode switches: `.segmented` with `aria-pressed` or `aria-current`.

## Components (already built — use these)

- `PageHeader` (`src/components/ui/page-header.tsx`) — title, subtitle, action slot, children slot.
- `KpiStrip` (`src/components/ui/kpi-strip.tsx`) — `items: {label, value, context?, tone?}[]`. Replaces all metric-tile grids.
- `Badge` — `default|success|warning|danger`, 4px radius.
- `HealthIndicator` — icon + label.
- `EmptyState` — well with icon, title, one-line description, optional action.
- Buttons: `className="btn"` (secondary), `"btn btn-primary"` (one per view), `"btn btn-ghost"`, add `btn-sm` for dense rows. 6px radius. Icons 14–16px lucide, `aria-hidden`.
- Inputs: `className="input"`. Search inputs get a leading lucide `Search` icon inside.
- Status tags: `.badge-success|warning|critical|info` classes with `rounded-[var(--radius-xs)] px-1.5 py-0.5 text-xs font-medium`.
- Alerts/callouts: `.alert-box alert-critical|warning|info|success` (tint + full border), with a leading icon.

## Copy

Short, specific, sentence case. Titles name the thing ("Accounts", "Revenue retention"), subtitles give scope and source ("99 customers · Q4'26 budget"). No "Executive Intelligence Report", no "powered by", no exclamation marks, no em dashes.

## Print

`[data-print="hide"]` removes chrome. Panels print with a 1px grey border. Status tints print (`print-color-adjust: exact`).
