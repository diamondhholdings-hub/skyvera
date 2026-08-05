# User Guide

**Last updated: 2026-08-05** (reflects Q3'26 data and PR #2 — WCAG 2.2 hardening, real financial metrics, DM briefing Accept button, BU-filtered accounts)

Complete guide for using the Skyvera Executive Intelligence System. This is an internal tool — every page below is reachable once you're on the network/VPN with access to the deployed app; there is no separate login step documented here (see [Getting Started](#getting-started)).

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Dashboard](#dashboard)
- [Customer Intelligence (Accounts)](#customer-intelligence-accounts)
- [Account Plans](#account-plans)
- [Natural Language Queries](#natural-language-queries)
- [Scenario Modeling](#scenario-modeling)
- [DM% Strategy Center](#dm-strategy-center)
- [Product Agent](#product-agent)
- [Alerts](#alerts)
- [Tips & Best Practices](#tips--best-practices)
- [Keyboard Shortcuts](#keyboard-shortcuts-future)
- [Getting Help](#getting-help)
- [Frequently Asked Questions](#frequently-asked-questions)
- [What's Next](#whats-next)

---

## Overview

The Skyvera Executive Intelligence System is an AI-powered platform for portfolio management, financial analysis, and customer intelligence across Skyvera's three core business units — **Cloudsense**, **Kandy**, and **STL** — plus smaller divisions (NewNet, PeerApp, Mobilogy, etc.) that roll up separately. It provides:

- **Real-time Insights**: Live dashboard with KPIs across ~$12.7M quarterly revenue (Cloudsense + Kandy + STL combined)
- **Customer Intelligence**: 101 active accounts in the current quarter's snapshot (across Cloudsense, Kandy, STL, and NewNet) with health scoring and risk analysis — this number changes quarter to quarter as accounts churn in and out of the budget, which is normal business turnover, not a data error
- **AI-Powered Queries**: Ask questions in plain English about your business
- **Scenario Planning**: Model pricing changes, churn, and expansion opportunities — via a conversational AI assistant or a traditional form
- **DM% Strategy Center**: AI-generated revenue-retention recommendations per business unit, with an impact calculator and 12-month trend charts
- **Product Intelligence**: AI-driven pattern detection for product opportunities
- **Account Planning**: Comprehensive 8-tab account plans with OSINT intelligence and a per-account AI chat assistant

---

## Getting Started

### Accessing the System

1. Open your browser and navigate to the application URL (ask your team lead if you don't have it — this is an internal tool, not publicly listed)
2. You'll land on `/dashboard` by default
3. Use the navigation bar at the top of every page to move between sections

### Navigation Bar

The main navigation (visible on every page) includes:

| Nav item | Destination | Covers |
|---|---|---|
| **Dashboard** | `/dashboard` | Executive KPIs, BU performance, top customers, at-risk accounts, expansion pipeline, action plan |
| **Accounts** | `/accounts` | Customer directory — search, filter, sort, and drill into individual account plans |
| **Alerts** | `/alerts` | Proactive alerts for at-risk accounts and metric anomalies |
| **DM Strategy** | `/dm-strategy` | Revenue-retention recommendations, portfolio DM% dashboard, 12-month trend charts |
| **Scenarios** | `/scenario` | What-if modeling (pricing, churn, expansion) |
| **Ask** | `/query` | Natural-language question answering |

**Product Agent** (`/product-agent`) is not currently on the main nav bar — reach it by typing the URL directly, or via any link to it elsewhere in the app (e.g. dashboard action items that reference product opportunities).

---

## Dashboard

The Executive Dashboard (`/dashboard`) provides a comprehensive view of business performance across Cloudsense, Kandy, and STL. It is organized into a **DM% briefing banner** (always visible at the top) plus **7 sections** you switch between using the section tabs just below the page title.

### Section Navigation

Click any of the 7 tabs to switch sections — the URL updates (`?section=financial-summary`, etc.) so you can bookmark or share a link straight to a specific section:

1. **Financial Summary**
2. **Financial Analysis** (labeled "Financial Detailed" internally)
3. **Customer Summary**
4. **Top Customers**
5. **At-Risk Accounts**
6. **Expansion Pipeline**
7. **Action Plan**

### DM% Strategy Briefing (top of every dashboard view)

Above the 7 sections, a **Revenue Retention Briefing** card always shows the most urgent (critical/high priority) DM% recommendations across the whole portfolio, up to 5 at a time:

- Each row shows the account name, business unit, a truncated recommendation title, and the dollar ARR impact
- **Accept** — click to accept the recommendation directly from the dashboard. This is a "quick accept": it optimistically marks the card as accepted immediately, calls the API in the background, and shows a success toast when confirmed. If the request fails, the card reappears and an error toast explains why — no page reload needed either way.
- **Details** — opens the full DM Strategy page pre-filtered to that recommendation
- **View All** (top-right of the card) — goes to `/dm-strategy` for the full recommendation feed
- If there are no urgent recommendations, the card shows "No urgent recommendations at this time."

### 1. Financial Summary

**Overall Assessment banner** — a color-coded alert box giving a one-line read on the quarter (e.g. "PROCEED WITH CAUTION") followed by a short narrative citing the current EBITDA margin, EBITDA dollar figure, YoY change, and margin gap.

**KPI Cards** display real, Excel-sourced figures for the current quarter:
- **Total Revenue** (current quarter, Cloudsense + Kandy + STL)
- **EBITDA** with margin %
- **Net Margin Gap** — dollar and percentage-point gap vs. the blended margin target
- **ARR (Annualized)** — quarterly RR × 4, with YoY change direction and %
- **Rule of 40** — revenue growth % + margin %; shown as PASSING (≥40) or FAILING (<40). Note: this YoY calculation only covers the three core BUs' historical comparison sheets (~86% of total revenue) — smaller divisions like NewNet/PeerApp/Mobilogy lack historical comparison data, so this is a slight underestimate of the true company-wide Rule of 40.
- **AR > 90 Days** — aged receivables, both as a dollar figure and as % of ARR

If any of YoY change, Rule of 40, or AR aging can't be computed from the current workbook, the card shows "N/A" / "DATA UNAVAILABLE" rather than a stale or guessed number — this is intentional, not a bug.

**Critical Financial Issues** — three call-out cards below the KPIs:
1. **Margin Gap** breakdown table (HC COGS increase, RR decline, NHC expense increase, CF COGS decrease — each with a dollar impact and one-line explanation)
2. **Recurring Revenue Declining/Growing** — a per-BU table comparing the current plan's RR to the Prior Plan, with the variance highlighted red (decline) or green (growth)
3. **Salesforce UK Contract** — a standing critical concern: the $4.1M/year Salesforce UK contract, shown as a % of Cloudsense's recurring revenue

**Business Unit Performance table** — one row per BU showing Revenue, Customers, Net Margin, Margin Target, and Delta (EBITDA vs. margin-target dollar gap, color-coded red/green).

**How to use:**
- Click **any BU row** (or the BU name link inside it) to jump straight to `/accounts?bu=<BU name>` — the Accounts page opens pre-filtered to that business unit's customers. This works because the accounts page reads the `bu` URL parameter server-side, so the filtered link is bookmarkable and shareable.
- Compare Delta across BUs to spot which one is furthest from its margin target
- Use the Margin Gap and RR Declining tables to identify root causes before a leadership review

### 2. Financial Analysis (Financial Detailed)

**Charts include:**
- Revenue by BU (distribution across Cloudsense, Kandy, STL)
- Revenue Composition (RR vs NRR breakdown)
- Margin Performance (net margin by BU vs. real per-BU margin targets)

**How to use:**
- Hover over chart segments for exact values
- Compare actual vs. target margins to identify improvement areas
- Identify which BU is furthest from its own target — note the targets differ by BU (Cloudsense and Kandy are lower than STL's), so don't compare BUs against a single blanket number

### 3. Customer Summary

**Metrics:**
- Total customer count across Cloudsense, Kandy, and STL
- Health distribution: **Healthy** (green), **At Risk** (yellow), **Critical** (red) — shown as both a count and a percentage of the total for each tier. Check the live page for current counts; these shift as accounts are re-scored.

**Insights:**
- Use health tier percentages as an early warning system — a rising Critical/At-Risk share quarter over quarter is worth flagging even before individual accounts are reviewed
- Click **View All Accounts** to go to the full Accounts directory

### 4. Top Customers

**Table shows:**
- Customer name and business unit
- Total revenue (quarterly)
- ARR
- Health score indicator
- Quick action to view the account plan

**How to use:**
- Click a customer name to view its detailed account plan
- Use this section to identify the largest revenue contributors and confirm their health scores are healthy

### 5. At-Risk Accounts

**Focus on customers with:**
- Health score: "At Risk" or "Critical"
- Elevated churn probability
- Upcoming contract renewals
- Payment issues (AR > 90 days)

**Action Items:**
- Schedule executive reviews for critical accounts
- Initiate retention campaigns
- Address specific risk factors
- Monitor weekly for status changes

### 6. Expansion Pipeline

**Identifies customers with:**
- Strong health scores
- High usage relative to plan
- Multiple subscriptions (cross-sell potential)
- Growing revenue trend

**Opportunity Types:**
- **Upsell**: Upgrade to a higher tier
- **Cross-sell**: Add additional products
- **Expansion**: Increase user count or features

### 7. Action Plan

**Strategic recommendations:**
- Prioritized initiatives (P0, P1, P2)
- Owner assignments
- Timeline estimates
- Expected impact ($ARR)

**How to use:**
- Review P0 items first (critical)
- Track progress weekly
- Update status as completed
- Re-prioritize quarterly

---

## Customer Intelligence (Accounts)

The Accounts page (`/accounts`) provides comprehensive intelligence on every customer across Cloudsense, Kandy, STL, and NewNet.

### Getting to the Accounts Page Pre-Filtered

There are two ways a BU filter can be applied:

1. **From a link** — e.g. clicking a BU row on the Dashboard's Business Unit Performance table takes you to `/accounts?bu=Cloudsense` (or Kandy/STL/NewNet). This filter happens on the server before the page even renders, so the URL is fully bookmarkable and shareable — send a teammate that link and they'll see the same filtered view.
2. **From the on-page filter buttons** (below) — these are instant, client-side filters layered on top of whatever the URL already loaded.

### Search, Filter, and Sort

**Search bar** — type any part of a customer name; results filter as you type (debounced ~300ms). The header subtitle also reflects a `?search=` URL parameter if you arrive with one pre-filled, so search results are bookmarkable too.

**Sort controls** — a dropdown (Total Revenue / ARR / Name / Health) plus a toggle button to flip ascending/descending. Default is Total Revenue, descending.

**Business Unit filter** — buttons for **All, Cloudsense, Kandy, STL, NewNet**. Click one to narrow the card grid to that BU only.

**Health Status filter** — buttons for **All, Healthy, At Risk & Critical, Critical**. "At Risk & Critical" matches both yellow and red accounts in one click, which is the fastest way to pull up a full retention worklist.

**Results count** — shows how many accounts match the current filters (and how many that's filtered down from), plus the current page number if there's more than one page.

**How to use:**
1. Use the BU and Health filters to narrow to a specific segment
2. Sort by Total Revenue to find the largest accounts, or by Health to triage risk
3. Click "At Risk & Critical" to build a retention-focused worklist
4. Click any account card to open its full account plan

### Account Cards

Each account is shown as a card (not a plain table row) with:
- Rank badge (based on current sort order)
- Customer name and Business Unit tag
- Total, ARR, and NRR figures
- A **completeness badge** (0–100%) and a **health indicator** (color dot)
- 24 cards per page, with numbered pagination controls at the bottom

### Data Completeness Scoring

Each account card displays a **0–100% completeness badge** covering 7 dimensions: stakeholders, pain points, competitors, opportunities, actions, intelligence reports, and enrichment data. Use this to prioritize which accounts need attention before key meetings.

### Last-Enriched Badge

Account detail pages show when the account data was last refreshed from external sources (RapidAPI + OpenCorporates). If an account hasn't been enriched recently, the badge will indicate it.

### Bulk Enrichment

Accounts can be enriched in bulk from the command line (requires `RAPIDAPI_KEY` and optionally `OPENCORPORATES_API_KEY` in `.env.local`):

```bash
npm run enrich:accounts                        # All accounts (~19 min for the full portfolio)
npm run enrich:accounts -- --limit 10          # First 10 only
npm run enrich:accounts -- --bu Cloudsense     # One BU only
```

Results are cached to `data/enrichment/{slug}.json`. If API keys are missing, the pipeline runs in degraded mode — sections are marked `skipped` rather than failing.

---

## Account Plans

Each customer has a comprehensive 8-tab account plan with OSINT-powered intelligence, plus a floating AI chat assistant scoped to that account. Tabs are accessible via URL (`?tab=overview`, `?tab=key-executives`, etc.) — links are bookmarkable, shareable, and don't scroll the page when you switch tabs.

**Tabs, in the order they appear on screen:** Overview · Key Executives · Org Structure · Pain Points · Competitive · Action Plan · Financial · Intelligence

**Page-level controls** (top-right of the hero header):
- **Print** — generates a print/PDF-friendly view of the current tab (hides navigation chrome)
- **Refresh Data** — re-fetches the account's underlying data
- **Salesforce Sync** — pushes/pulls updates from Salesforce for this account

### Tab 1: Overview

**Executive Summary:**
- Company description
- Key metrics (ARR, contract details)
- Relationship strength (1–5 stars)
- Strategic importance
- Quick wins and risks

**Stakeholder Directory:**
- Key contacts with roles
- Decision-makers and influencers
- Contact information
- Engagement history

**How to use:**
- Review before customer meetings
- Update after significant changes
- Share with sales/CS teams
- Track relationship strength over time

### Tab 2: Key Executives

**Decision-maker profiles:**
- Executive name, title, and LinkedIn profile
- Contact intelligence (email, phone where available)
- Relationship strength with your team (1–5 stars)
- Engagement history (last contact, cadence)
- Notes on communication style and priorities

**How to use:**
- Review before executive meetings or QBRs
- Identify gaps (roles with no contact established)
- Track multi-threaded relationships across the account
- Note changes after leadership transitions (flagged in the Intelligence tab)

### Tab 3: Org Structure

**Org Chart:**
- Reporting structure
- Department breakdown
- Headcount by function
- Key stakeholders mapped to org

**Decision-Making Process:**
- Approval hierarchy
- Budget cycles
- Procurement process
- Key influencers

**How to use:**
- Map your contacts to the org structure
- Identify gaps in coverage
- Understand decision flow
- Target the right stakeholders for initiatives

### Tab 4: Pain Points

**Business Priorities:**
- Strategic initiatives (current year)
- Technology roadmap
- Digital transformation plans
- Pain points and challenges

**Technology Stack:**
- Current tools and platforms
- Integration requirements
- Tech debt areas
- Future state vision

**How to use:**
- Align your solutions to their priorities
- Identify integration opportunities
- Position value based on their goals
- Anticipate future needs

### Tab 5: Competitive

**Competitive Landscape:**
- Known competitors in the account
- Win/loss history
- Competitive threats
- Differentiation points

**Market Position:**
- How the customer views your solution
- Competitive advantages
- Areas of concern
- Switching barriers

**How to use:**
- Defend against competitive threats
- Highlight differentiators
- Address concerns proactively
- Build switching costs (integration, training)

### Tab 6: Action Plan

**Kanban Board with columns:**
- **Backlog**: Future tasks
- **To Do**: Upcoming tasks (this quarter)
- **In Progress**: Active work
- **Done**: Completed tasks

**Action Item Fields:**
- Title and description
- Owner (sales rep, CSM, etc.)
- Priority (High, Medium, Low)
- Due date
- Status

**How to use:**
- Add action items from meetings
- Assign to team members
- Track progress weekly
- Review completed items in QBRs

**Quick Add:**
- Click "+ Add Action" in any column
- Enter title and details
- Assign owner and due date
- Drag to reorder or move between columns

### Tab 7: Financial

**Revenue Analysis:**
- Historical revenue trends
- Contract details (start date, end date, value)
- Payment history
- AR aging (if applicable)
- Renewal forecast

**Subscription Details:**
- Subscription IDs
- Product/service breakdown
- Pricing tiers
- Usage metrics

**How to use:**
- Monitor revenue trends (growing/flat/declining)
- Track payment issues early
- Forecast renewals accurately
- Identify upsell opportunities based on usage

### Tab 8: Intelligence (OSINT-Powered)

**News & Market Intelligence:**
- Recent company news
- Executive changes
- M&A activity
- Market trends affecting the customer
- Financial performance

**Sentiment Analysis:**
- Positive developments (green)
- Neutral updates (gray)
- Negative signals (red)

**How to use:**
- Stay informed about customer changes
- Reach out after executive changes
- Adjust strategy based on financial performance
- Identify expansion opportunities from growth signals

### AI Chat Assistant (every account plan page)

A floating chat button sits in the bottom-right corner of every account plan page. Click it to open a small chat panel scoped to that specific account:

- Comes with 4 suggested starter questions (biggest risks, meeting prep, upsell opportunities, key decision-makers)
- Responses stream in as the AI generates them
- Press **Enter** to send, **Shift+Enter** for a new line
- Press **Escape** to close the panel — focus returns to the chat button so keyboard users aren't stranded
- This chat only knows about the account you're currently viewing — open a different account's page to ask about a different customer

---

## Natural Language Queries

The Query page (`/query`, "Ask" in the nav bar) lets you ask questions about your business in plain English and get AI-powered answers. The page is a two-column layout: query input and results on the left (wider), canned queries and the metrics catalog on the right.

### Query Input

**Example Questions:**
- "Which customers have ARR over $500K?"
- "Show me top 5 customers by revenue in Cloudsense"
- "What is our net margin and how does it compare to target?"
- "Which customers are at risk of churning?"
- "What's our total recurring revenue?"

**Tips for better results:**
- Be specific (numbers, timeframes, filters)
- Use business terms (ARR, RR, EBITDA)
- Ask follow-up questions for clarification
- Include filters (by BU, health score, revenue tier)

### Canned Queries

**Pre-built queries for common questions:**
- Top customers by revenue
- At-risk customer analysis
- Revenue breakdown by BU
- Upcoming renewals
- Expansion opportunities

**How to use:**
1. Click a canned query
2. Optionally adjust filters
3. View results instantly
4. Drill into details

### Understanding Responses

**Response includes:**
- **Answer**: Detailed response in markdown format
- **Confidence**: High, Medium, or Low
- **Data Points**: Number of records analyzed
- **Sources**: Data sources used (customer_database, subscriptions, etc.)

**Confidence levels:**
- 🟢 **High**: Strong data support, clear answer
- 🟡 **Medium**: Some assumptions made, verify results
- 🔴 **Low**: Limited data, requires clarification

If the AI needs more information before it can answer, it shows a **clarification question with clickable options** instead of a final answer — pick one and it re-runs with your answer folded in (it won't ask the same clarifying question twice).

### Conversational Context

**Follow-up questions:**
```
You: "Which customers are in Cloudsense?"
AI: "Cloudsense has N customers with total ARR of $X..."

You: "Which of those are at risk?"
AI: "Of the N Cloudsense customers, Y are at risk..."
```

**How it works:**
- The system carries the running Q&A history forward as context for each new query in the same session
- Reference previous answers naturally
- Ask progressively more specific questions
- Start a new browser tab/session for a genuinely different topic — history isn't saved across page reloads

### Metrics Catalog

**Available metrics:**
- **RR**: Recurring Revenue (subscription-based)
- **NRR**: Non-Recurring Revenue (one-time)
- **ARR**: Annual Recurring Revenue (RR × 4)
- **MRR**: Monthly Recurring Revenue (RR / 3)
- **EBITDA**: Earnings before interest, taxes, depreciation, amortization
- **Net Margin**: (Revenue − Costs) / Revenue
- **Churn Rate**: % of customers lost per period
- **CLV**: Customer Lifetime Value

The Metrics Catalog panel on the right of the page lists full definitions for every metric the query engine understands.

---

## Scenario Modeling

The Scenario page (`/scenario`, "Scenarios" in the nav bar) models business scenarios to forecast financial impact and strategic implications. At the top of the page is a **mode toggle** — pick whichever fits how well-defined your scenario already is.

### Conversational AI Mode (default, marked "NEW")

Describe your scenario in natural language, in a chat-style interface. The AI asks clarifying questions, suggests refinements, and helps you explore multiple alternatives through conversation. Best when you're still exploring a complex scenario or aren't sure of exact parameters yet.

### Traditional Form Mode

Structured forms for entering exact scenario parameters. Choose a scenario type and enter precise values. Best when you already know exactly what you want to model.

#### 1. Pricing Change

**Model:**
- Price increase/decrease percentage
- % of customers affected
- Expected churn rate from the price change

**Example Use Case:** "What if we increase prices 10% for 80% of customers, expecting 5% to churn?"

**Outputs:** Projected revenue change, net margin impact, customer churn impact, ARR at risk.

#### 2. Customer Churn

**Model:** Specific customers lost, quarter of churn, downstream effects.

**Example Use Case:** "What's the impact of losing our two largest Cloudsense accounts in Q2?"

**Outputs:** Revenue loss, margin impact, replacement cost, strategic recommendations.

#### 3. Expansion/Upsell

**Model:** Target customers, expected upsell % (e.g. 25% ARR increase), conversion rate (% who will actually buy).

**Example Use Case:** "What if we upsell our top 10 customers by 25% with 75% conversion?"

**Outputs:** Revenue upside, required sales capacity, implementation timeline, risk factors.

### Using the Traditional Form

1. **Select Scenario Type**: Choose from the dropdown
2. **Set Parameters**: Target BU (optional), timeframe, assumptions (varies by scenario type)
3. **Add Description**: Explain the scenario for future reference
4. **Click "Analyze"**: Wait a few seconds for results
5. **Review Results**: Calculated metrics (revenue, margin, EBITDA), Claude's analysis (strategic insights), risks and recommendations, alternative scenarios

### Interpreting Results

**Calculated Metrics:** Baseline vs. Projected (side-by-side), delta ($ and %), affected customers.

**Claude Analysis:**
- **Summary**: Executive overview
- **Key Insights**: Main takeaways
- **Risks**: Potential issues with severity and mitigation
- **Recommendations**: Prioritized actions with owners
- **Alternatives**: Other approaches to consider
- **Confidence**: High/Medium/Low based on assumptions

**How to use results:**
- Present to leadership for decision-making
- Test multiple scenarios to find the optimal path
- Document assumptions for an audit trail
- Revisit quarterly as the business changes

---

## DM% Strategy Center

The DM Strategy Center (`/dm-strategy`, "DM Strategy" in the nav bar) is where you review and act on AI-generated revenue-retention recommendations across the portfolio. "DM%" is the decline/maintenance rate — the natural attrition rate for recurring revenue.

### Hero + Trends Link

At the top of the page, a hero banner summarizes portfolio-wide DM% stats. Just below it, a callout links to **`/dm-strategy/trends`** — a dedicated page with interactive 12-month DM% trend charts for each business unit, useful for spotting whether retention is improving or worsening over time.

### Business Unit Cards

A row of BU cards sits above the recommendation feed. Click a card to filter the feed to that BU only; click it again (or use the "← All Business Units" button that appears) to clear the filter.

### Recommendation Feed

**Preset filters:** All / Critical / High Impact (≥$500K ARR) / Quick Wins (Low risk + ≥$100K ARR)

**Additional dropdown filters:**
- **Category**: Retention, Expansion, Pricing, Product, Engagement, Health
- **Priority**: Critical, High, Medium, Low
- **Clear All Filters** button appears once any filter is active

**Each recommendation card has three actions:**

- **Accept** — opens a modal to confirm accepting the recommendation (optionally creating a linked action item). On submit, the page reloads with the recommendation moved out of the pending feed and reflected in the Impact Calculator. This is the same underlying accept flow the Dashboard's quick-Accept button uses — the modal here just lets you attach more detail (an action item) at the same time.
- **Review** — jumps to the relevant account's plan page. If the recommendation is portfolio-wide (not tied to one account), you'll see an info toast explaining there's no single account page for it instead of a broken link.
- **Defer** — opens an inline dialog requiring you to type a reason before you can confirm. Deferring without a reason is blocked (the Confirm button stays disabled until you type something).

### Impact Calculator (right sidebar)

Shows current DM% and ARR vs. **projected** DM% and ARR based on every recommendation you've accepted so far, plus a running count of accepted vs. total recommendations.

### DM% Sensitivity Reference (right sidebar, below the calculator)

A reference table converting an annual DM% into its quarterly and monthly equivalents, with floor/breakeven rows highlighted and a verdict column — useful for translating a recommendation's ARR impact into "does this actually move the needle" terms without doing the compounding math by hand.

### Trends Page (`/dm-strategy/trends`)

Interactive charts showing each business unit's DM% over the trailing 12 months. Use this to confirm whether a BU's retention trend is a one-quarter blip or a sustained pattern before committing to a strategy change.

---

## Product Agent

AI-powered system that detects patterns in customer data and generates Product Requirements Documents (PRDs). Reached at `/product-agent` (not currently linked from the main nav bar — bookmark it or link to it directly).

The **System Status** card at the top of the page shows a handful of static counters (customers loaded, business units, total ARR, PRDs generated) — these are illustrative figures baked into the page, not a live read of the current quarter's data, so don't quote them in a report; use the Dashboard's Financial Summary section for live figures instead.

### Pattern Detection

**How it works:**
1. Analyzes all customer data (revenue, health, subscriptions)
2. Detects patterns suggesting product opportunities
3. Calculates confidence scores
4. Recommends PRD generation for high-confidence patterns

**Pattern Types:**
- **Churn Risk**: AR aging + support volume spikes
- **Revenue Decline**: Customers with declining RR
- **Expansion Opportunity**: High-value customers ready for a premium tier
- **Multi-BU Consolidation**: Customers across multiple business units

### Running Analysis

1. Click **Run Test Analysis** on the Product Agent page (or go to `/product-agent/test-analysis` directly)
2. **Configure Analysis**: Scope (Full or Incremental), Business Unit (All, Cloudsense, Kandy, or STL), Analysis Type (All, Churn, Expansion, or Consolidation)
3. Click **Run Analysis**
4. **Review Detected Patterns**: pattern name and signal, affected customers, financial impact (ARR at risk/opportunity), confidence score, PRD recommendation

### Understanding Patterns

**Pattern Card shows:**
- **Signal**: What triggered this pattern (e.g. "8 enterprise customers with AR issues")
- **Customers**: List of affected accounts
- **Financial Impact**: ARR at risk, opportunity, or other impact
- **Confidence**: 0–1 scale (higher = more certain)
- **Opportunity**: Suggested product/feature
- **PRD Recommended**: Yes/No based on confidence threshold

**Confidence Interpretation:**
- 🟢 **> 0.8**: Strong signal, high confidence → Generate PRD
- 🟡 **0.6 – 0.8**: Moderate signal → Validate with customers first
- 🔴 **< 0.6**: Weak signal → Monitor, don't act yet

### Generating PRDs

1. Click **Generate PRD** on a recommended pattern
2. Wait 10–20 seconds (AI generates a comprehensive PRD)
3. Review the generated PRD: 14 sections (Executive Summary to Appendix), priority score (0–100), priority class (P0/P1/P2/P3/P4), leverage classification, implementation estimate

**PRD Sections:** Executive Summary · Strategic Context · Problem Statement · Success Metrics · User Stories & JTBD · Proposed Solution · Technical Approach · Implementation Plan · Go-to-Market Strategy · Risk Analysis · Open Questions · Alternatives Considered · Success Criteria · Appendix

**Priority Classes:**
- **P0** (90–100): Critical — ship this quarter
- **P1** (80–89): High — next 2 quarters
- **P2** (70–79): Medium — next 3–4 quarters
- **P3** (60–69): Low — backlog
- **P4** (< 60): Very low — consider declining

**Leverage Classification:**
- **Leverage**: High impact, prevents churn (top priority)
- **Neutral**: Standard priority
- **Overhead**: Low impact (deprioritize)

### PRD Workflow

**Status Flow:** Auto-Published (if priority ≥ 85) → Pending Review (if priority < 85) → Approved (after PM review) → In Dev → Shipped → Rejected (decided not to pursue)

**Actions:**
- **Review**: PM reviews the PRD and approves/rejects
- **Assign**: Assign a PM and Engineering Lead
- **Track**: Monitor in PRDLifecycle for learning

---

## Alerts

The Alerts page (`/alerts`) keeps you informed about critical issues requiring immediate attention: a summary strip at the top, followed by the full list of alert cards.

### Alert Types

**1. At-Risk Customers**
- Health score dropped to "At Risk" or "Critical"
- Payment overdue (AR > 90 days)
- Usage declining significantly
- Contract renewal at risk

**2. Revenue Alerts**
- Notable revenue variance
- RR declining quarter-over-quarter
- Churn spike detected
- Large customer payment issues

**3. System Alerts**
- API rate limits approaching
- Database performance degradation
- Cache hit rate below threshold
- Error rate spike

### Alert Priority

- 🔴 **Critical**: Requires immediate action (< 24 hours)
- 🟡 **High**: Address within 1 week
- 🔵 **Medium**: Address within 2 weeks
- ⚪ **Low**: Monitor, no immediate action needed

### Alert Actions

**For Customer Alerts:** View account details, review recent interactions, schedule an executive review, assign to the account team, create a retention plan.

**For System Alerts:** Check system health, review error logs, scale resources, contact engineering.

---

## Tips & Best Practices

### Dashboard

- **Review daily**: Spot trends early
- **Check the DM Briefing banner first**: It surfaces the most urgent retention items before you even pick a section
- **Compare to targets**: Focus on gaps — remember each BU has its own margin target, they're not all the same number
- **Track top customers**: Monitor health weekly
- **Share with leadership**: Weekly snapshot

### Account Plans

- **Update regularly**: After every customer interaction
- **Collaborate**: Share with sales/CS teams
- **OSINT intelligence**: Review news weekly
- **Action items**: Groom the kanban board weekly
- **Use the AI chat panel**: Ask it to prep you for a meeting before you go digging through all 8 tabs manually

### Natural Language Queries

- **Start broad, then narrow**: "Show customers" → "Show at-risk customers in Cloudsense"
- **Use filters**: Speeds up responses and improves accuracy
- **Check confidence**: Low confidence = ask for clarification
- **Explore canned queries**: Learn by example

### Scenario Modeling

- **Use Conversational mode when exploring**, Form mode when you already know your numbers
- **Test multiple scenarios**: Don't rely on a single model
- **Document assumptions**: Helps with future reference
- **Involve stakeholders**: Get input on assumptions
- **Update quarterly**: Re-run scenarios as the business changes

### DM% Strategy Center

- **Check the Trends page before committing to a strategy shift** — confirm the DM% movement is a real trend, not one noisy quarter
- **Use the Quick Wins filter first** — low-risk, meaningful-impact recommendations are the easiest sell to leadership
- **Always give a real reason when deferring** — the field is required, and future-you (or a teammate) will want to know why something was passed over

### Product Agent

- **Run analysis monthly**: Catch patterns early
- **Validate with customers**: Don't build without feedback
- **Prioritize ruthlessly**: Focus on P0/P1 only
- **Track outcomes**: Update PRDLifecycle post-launch
- **Don't quote the System Status counters**: they're static placeholder figures on that page, not live data

### General

- **Use keyboard shortcuts**: (Future feature)
- **Bookmark frequently used pages**: Dashboard, Query, Accounts — most filtered views (BU, search, tab, section) are URL-encoded, so bookmarking a filtered view works
- **Enable notifications**: (Future feature) Get alerts on critical events
- **Provide feedback**: Help improve the system

---

## Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `g d` | Go to Dashboard |
| `g a` | Go to Accounts |
| `g q` | Go to Query |
| `g s` | Go to Scenario |
| `?` | Show shortcuts |

---

## Getting Help

### In-App Help

- **Tooltips**: Hover over icons for explanations
- **Metrics Catalog**: On the Query page, defines every financial term the query engine understands
- **Example Queries**: Use canned queries to learn syntax

### Support

- **Technical Issues**: Contact engineering team
- **Feature Requests**: Submit via Product Agent or email
- **Data Questions**: Contact business operations
- **Training**: Request a demo or training session

---

## Frequently Asked Questions

**Q: How often is data updated?**
A: Dashboard and customer data refresh on a short cache cycle (a few minutes); `DEMO_MODE` extends this to 30 minutes when enabled.

**Q: Can I export data?**
A: Not yet, but planned for a future release. Use the Print button on account plan pages, or screenshots, in the meantime.

**Q: Why are some queries slow?**
A: Complex queries require Claude API calls (a few seconds). Cached queries return instantly.

**Q: What happens if I lose a customer?**
A: Run a churn scenario to model the impact. Accounts that fully churn out of the budget between quarters (this happens — it's normal turnover) simply drop out of the Accounts directory and dashboard totals the following quarter.

**Q: Can I add custom metrics?**
A: Yes, developers can extend the semantic layer (`src/lib/semantic/`). Contact engineering.

**Q: How accurate is the churn prediction?**
A: Confidence is indicated per prediction. Validate high-risk customers with account teams.

**Q: Can I customize the dashboard?**
A: Not yet, but planned. The current dashboard is optimized for an executive view.

**Q: How do I report a bug?**
A: Email engineering with screenshots and steps to reproduce.

**Q: Why did the customer count change between quarters?**
A: The underlying budget workbook is swapped each quarter, and accounts genuinely churn in and out of it. A shrinking or growing count reflects real business activity, not a bug.

---

## What's Next?

**Upcoming Features:**
- Custom dashboards
- Email alerts
- Data export (CSV, Excel)
- Mobile app
- Slack integration
- Advanced filtering
- Bulk actions
- API access for external tools

**Stay tuned for updates!**
