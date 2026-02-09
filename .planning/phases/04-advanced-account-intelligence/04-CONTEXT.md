# Phase 4: Advanced Account Intelligence - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Comprehensive 7-tab account plan interface (Overview, Financials, Organization, Strategy, Competitive, Intelligence, Action Items) with real-time intelligence and competitive context. Users can navigate organization structures, track pain points, manage action plans, and receive Claude-generated strategic insights from multi-source data.

</domain>

<decisions>
## Implementation Decisions

### Tab Navigation & Layout
- **Horizontal tabs at top** - Traditional tab bar across top of page (familiar pattern, works well for 7 tabs on desktop)
- **Instant switch with loading states** - Tab content loads after switch, shows skeleton/spinner while fetching data
- **Dropdown tab selector on mobile** - 7 tabs become dropdown menu on mobile to save space
- **Persist active tab state** - Use URL params or localStorage to remember last visited tab (return to Financials if that's what you were viewing)

### Organization Mapping
- **Org chart tree view** - Visual hierarchy showing reporting lines (CEO → VP → Directors → Managers)
- **Full profile cards** - Each stakeholder shows: name, title, role, contact (email/phone), tenure, interests, relationship strength, interaction history, notes field
- **Dual role system** - Both standard stakeholder roles AND RACI designations:
  - Standard categories: Decision Maker, Influencer, Champion, User, Blocker
  - RACI matrix: Responsible, Accountable, Consulted, Informed
  - Display: Primary role (Decision Maker) prominent, RACI (A) as smaller secondary indicator
- **Inline editing** - Click to edit cards directly with save/cancel - quick updates without leaving page

### Intelligence Content
- **Card format with sections** - Separate cards for: Opportunities, Risks, Recommendations (each with bullet points for scannability)
- **Timeline with sentiment badges** - News articles in chronological list with headline, date, source, sentiment (positive/negative/neutral)
- **Auto-refresh on tab visit** - Fetch fresh intelligence data each time Intelligence tab is opened (always current)
- **Cached data with stale warning** - If Claude/NewsAPI fails, display last successful fetch with timestamp: "Data from 2 hours ago - API unavailable"

### Action Management
- **Kanban board layout** - Visual board with three columns: To Do, In Progress, Done (drag-and-drop between columns)
- **Essential action card fields** - Title, owner, due date, priority (High/Medium/Low)
- **Color-coded priority badges** - Red = High, Yellow = Medium, Green = Low + accessible icons (exclamation/dash/check) for WCAG compliance
- **Both creation modes** - Quick add in column (type title, click for details) + modal form (full details upfront for complex actions)

### Claude's Discretion
- Exact loading skeleton design for tab transitions
- News article summary truncation length
- Drag-and-drop implementation library choice
- Error message copy and styling
- Empty state illustrations

</decisions>

<specifics>
## Specific Ideas

- Org chart should feel clean and professional - not cluttered like legacy enterprise tools
- Intelligence cards should be actionable - not just data dumps, but clear "what this means for us"
- Kanban drag interaction should be smooth - instant feedback, no lag
- The 7 tabs represent comprehensive account coverage - everything needed for strategic account planning

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-advanced-account-intelligence*
*Context gathered: 2026-02-09*
