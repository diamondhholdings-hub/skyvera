# Phase 6: Visual Design Implementation - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the functional platform UI to match reference HTML designs with editorial theme, professional typography, and polished component library. This is purely visual enhancement - no new features, no functionality changes. Implementing the design system from reference files (Financial Dashboard, index.html, Telstra/Liquid Telecom account plans) across existing pages.

</domain>

<decisions>
## Implementation Decisions

### Component Styling Approach

#### General Direction
- **Shadows**: Claude's discretion - choose prominence based on editorial theme
- **Borders**: Claude's discretion - decide visibility based on overall aesthetic
- **Card density**: Claude's discretion - balance readability with information density
- **Hover states**: Claude's discretion - choose interaction level by component type and context

#### Rationale for Discretion
User trusts Claude to interpret the editorial theme (Paper/Ink aesthetic) and reference designs to create a cohesive visual system. The reference HTML files provide design direction - Claude should follow their patterns for shadows, borders, spacing, and interactions.

### Layout & Spacing Rhythm

#### Fixed Decisions
- **Account directory layout**: Card grid (2-3 columns) matching index.html reference with hover effects

#### Claude's Discretion
- **Hero sections**: Decide whether to use gradient headers (like Financial Dashboard reference) or solid colors
- **Section separation**: Choose between visual dividers, whitespace only, or background alternation based on page context
- **Content width**: Choose max-width per page type (dashboards may be wider for data density, reading pages narrower for comfort)

#### Guiding Principle
Reference designs show gradient headers and specific layout patterns - follow these where they exist, apply principles consistently to pages without direct references.

### Claude's Discretion

Areas where Claude has full flexibility:
- Exact shadow values (elevation scale)
- Border color and opacity choices
- Padding and spacing scale (8px base, 4px/8px/12px/16px/24px/32px rhythm)
- Hover transition timing and easing functions
- Responsive breakpoint adjustments beyond reference designs
- Typography scale application (sizing hierarchy)
- Color palette application to specific components beyond what references show

</decisions>

<specifics>
## Specific Ideas

**From reference designs:**
- Financial Dashboard reference shows gradient header treatment
- index.html shows card grid for account directory with hover effects
- Telstra/Liquid Telecom references show hero header with stat cards and sticky tab navigation
- Editorial theme: Paper (#fafaf8), Ink (#1a1a1a), Accent (#c84b31), Secondary (#2d4263)
- Typography: Cormorant Garamond (display/headings) + DM Sans (body/UI)

**Design philosophy:**
- Paper/Ink editorial theme suggests print-inspired restraint and refinement
- Reference designs balance modern SaaS functionality with editorial sophistication
- Accessibility remains critical (WCAG 2.2 Level AA) - never rely on color alone

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope (visual design only, no functional changes)

</deferred>

---

*Phase: 06-visual-design-implementation*
*Context gathered: 2026-02-09*
