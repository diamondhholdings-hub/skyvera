---
version: alpha
name: Skyvera
description: Editorial Datafeed — a financial broadsheet that happens to be an app. Serif display, monospaced figures, brick-red accents on warm paper.

colors:
  ink: "#0F172A"
  paper: "#F8FAFC"
  surface: "#FFFFFF"
  surface-recessed: "#F1F5F9"
  border: "#E2E8F0"
  divider: "#CBD5E1"
  primary: "#C84B31"
  primary-hover: "#A83A22"
  secondary: "#1E3A8A"
  highlight: "#EFF6FF"
  muted: "#64748B"
  nav-bg: "#0D1B2A"
  nav-bg-end: "#162544"
  on-nav: "#E2E8F0"
  on-primary: "#FFFFFF"
  success: "#059669"
  success-tint: "#ECFDF5"
  success-ink: "#065F46"
  warning: "#D97706"
  warning-tint: "#FFFBEB"
  warning-ink: "#92400E"
  critical: "#DC2626"
  critical-tint: "#FEF2F2"
  critical-ink: "#991B1B"

typography:
  headline-display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "56px"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline-lg:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline-md:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body-lg:
    fontFamily: "Jost, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.005em"
  body-md:
    fontFamily: "Jost, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.005em"
  label-sm:
    fontFamily: "Jost, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.1em"
    fontFeature: '"case" 1'
  data-lg:
    fontFamily: "JetBrains Mono, Fira Code, monospace"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: '"tnum" 1, "case" 1'
  data-md:
    fontFamily: "JetBrains Mono, Fira Code, monospace"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.02em"
    fontFeature: '"tnum" 1'

rounded:
  xs: "3px"
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
  full: "9999px"

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
  gutter: "24px"
  page: "32px"
  max-width: 1400

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-recessed}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  metric-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.data-lg}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  metric-tile-on-nav:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  data-table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    padding: "12px 16px"
  data-table-row-hover:
    backgroundColor: "{colors.highlight}"
    textColor: "{colors.ink}"
  badge-success:
    backgroundColor: "{colors.success-tint}"
    textColor: "{colors.success-ink}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xs}"
    padding: "4px 10px"
  badge-warning:
    backgroundColor: "{colors.warning-tint}"
    textColor: "{colors.warning-ink}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xs}"
    padding: "4px 10px"
  badge-critical:
    backgroundColor: "{colors.critical-tint}"
    textColor: "{colors.critical-ink}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xs}"
    padding: "4px 10px"
  page-header:
    backgroundColor: "{colors.nav-bg}"
    textColor: "{colors.on-nav}"
    padding: "48px 32px 40px"
  nav-bar:
    backgroundColor: "{colors.nav-bg}"
    textColor: "{colors.on-nav}"
    typography: "{typography.body-md}"
    height: "56px"
    padding: "0 32px"
---

# Design System: Skyvera

## Overview

**The Editorial Datafeed.** Skyvera is an executive intelligence platform; it should read like the print edition of a business broadsheet that has been quietly engineered into software. The voice is composed and unhurried — a long-tenured analyst who has nothing to prove. Cormorant Garamond carries headlines in a light, almost editorial weight; Jost handles the running text with contemporary clarity; JetBrains Mono pins every figure to a tabular grid so dollar amounts never twitch. The palette is grounded — deep navy gives reports their weight, brick red is reserved for the single most important action on a screen, and warm cool-white paper holds it all together.

## Colors

The palette is a stack of grounded neutrals with two committed accents — and never more than that on one screen.

- **Ink (#0F172A):** Slate so deep it reads almost black. The voice of every headline, table cell, and serious number.
- **Paper (#F8FAFC) / Surface (#FFFFFF):** A cool warm-white page over pure-white cards — the broadsheet's two-tone ground.
- **Primary, "Brick" (#C84B31):** The sole driver of primary actions, focus rings, and active nav indicators. Earned, not sprinkled.
- **Secondary, "Royal Navy" (#1E3A8A):** The voice of authority — section titles inside cards, table headers, navigational depth.
- **Muted (#64748B) and Border (#E2E8F0):** The masthead's quiet structural lines. Use them like rules on a printed page.
- **Status (success / warning / critical):** Reserved for state, never for decoration. Each ships with a tint, an ink, and a border.

## Typography

Three families, three jobs — no overlap.

- **Cormorant Garamond** sets every `headline-*` level. Light at display size (300), semibold at section size (600). It is the only serif in the system; it carries the editorial gravitas.
- **Jost** sets every `body-*` and `label-sm`. Geometric, neutral, faintly humanist. Body sits at 14–17px with a 1.55–1.6 line height for long-form readability.
- **JetBrains Mono** sets every `data-*` token. Tabular figures (`tnum`) and case-sensitive forms (`case`) are mandatory; KPI tiles, table cells, and currency strings must never use a proportional face. Negative letter-spacing on data tightens columns without crushing legibility.

## Layout

Centered fixed-max-width container at **1400px**, with **32px** page gutters. Inside that, an **8-base spacing scale** (`xs 4` → `3xl 64`) with the named tokens `md 16` and `lg 24` doing the lion's share of the work. Cards hold **24px** internal padding; metric tiles compress to **20–22px**. Page sections separate with `xl` (32px); related cards within a row separate with `gutter` (24px). Long-form content tops out at **640–720px** measure even when its container is wider — paragraphs are still meant to be read.

## Elevation & Depth

Hierarchy is built primarily by **tonal layering** — paper under surface under highlight — with shadows used sparingly to lift only what must lift. Five quiet shadow tiers (`xs` through `xl`) all ride on the ink hue at low opacity, so depth never feels gray or generic. Resting cards take `sm`; hovered or focused cards step to `md` with a 2px upward translate. The page-header and nav-bar are dark surfaces (deep navy with a 135° gradient to `#162544`) — depth there comes from a faint grid overlay and two radial color washes (brick at 8%, navy at 15%), never from a drop shadow.

## Shapes

A **soft-architectural** corner language. The base radius is `md (10px)` for cards, modals, and metric tiles — enough softness to read as modern, restrained enough to keep the publication feel. Buttons and badges drop to `sm (6px)` or `xs (3px)` so small components don't appear bubbled. Inputs and table rows take `xs (3px)` to align with rule lines. Avatars and status dots use `full`. Nothing in the system is fully square; nothing is pill-shaped except live indicators. Mixing radii on adjacent elements is a tell — keep `md`-on-`md` and `sm`-on-`sm` neighborhoods tidy.

## Components

- **Buttons.** Primary uses brick on white type; secondary uses surface with ink type and a 1px border. Both wear `label-sm` (uppercase, tracked) — the typographic signal that this is an action.
- **Cards.** White surface, 1px border in `border`, `md` radius, `sm` shadow. The `card-hover` pattern lifts 2px on hover and steps the shadow to `md`.
- **Metric tiles.** On paper: white surface, mono numerals at `data-lg`, label in `label-sm` muted. On dark page-header surfaces: a translucent `rgba(255,255,255,0.05)` card with `backdrop-filter: blur(12px)` — same anatomy, dark theme.
- **Data table rows.** `body-md` for text, `data-md` for figures. Hover swaps the row to `highlight` (#EFF6FF). Headers ride on `secondary` with white type for printed-report gravitas.
- **Badges.** `success | warning | critical` only. Tinted background, ink-on-tint text, matching 1px border.

## Do's and Don'ts

- **Do** reserve `colors.primary` (brick) for one action per screen — primary CTA, focus ring, or the single active nav indicator. Never both at once.
- **Do** route every numeric value through a `data-*` typography token. Tabular figures are non-negotiable on a finance app.
- **Do** lean on tonal layering (paper → surface → highlight) before reaching for a shadow. Shadows are seasoning.
- **Do** use `headline-*` (Cormorant) for narrative headings and `label-sm` (Jost, tracked, uppercase) for utility labels — never the reverse.
- **Don't** apply gradient accents to metric tiles. The only gradient in the system lives on `page-header`. Tiles stay flat.
- **Don't** use a hero-metric template — one giant glowing KPI floating on a colored card. Skyvera shows metrics in disciplined grids, not dashboards-as-billboards.
- **Don't** add side-stripe colored borders (the 4px-left-accent-bar pattern). The only acknowledged stripe is the 3px brick-to-navy hover sweep on `card`. Error states use a tinted background with a full 1px border — not a vertical bar.
- **Don't** mix more than two type families on a single view; the third family (mono) is allowed only where digits live.
- **Don't** introduce new status hues. If you reach for purple or teal, the design has lost its bearings — return to the four committed colors.
