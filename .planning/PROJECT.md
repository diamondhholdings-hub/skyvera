# Skyvera Business Intelligence Platform

## What This Is

A comprehensive AI-powered executive intelligence platform for Skyvera that unifies financial data, customer account planning, real-time intelligence, and scenario modeling. Replaces fragmented Excel spreadsheets, static dashboards, and manual data gathering with an intelligent system that enables executives, BU leaders, and account managers to make data-driven decisions instantly.

**Current Phase:** Phase 7 — Post-Launch Hardening (in progress as of 2026-05-08)
**Design system:** `PRODUCT.md` (product register, users, anti-references) + `DESIGN.md` (24 color tokens, 8 typography tokens, 16 component specs, Editorial Datafeed register)

## Core Value

Executives and BU leaders can instantly understand business performance, customer health, and scenario impacts through AI-powered intelligence and natural language interaction - eliminating manual data gathering and enabling rapid strategic decision-making.

## Requirements

### Validated

Existing capabilities from current codebase:

- ✓ Financial data analysis from Excel budget files — existing
- ✓ Business unit P&L tracking (Cloudsense, Kandy, STL) — existing
- ✓ Recurring Revenue (ARR) and Non-Recurring Revenue tracking — existing
- ✓ Margin calculations and target tracking — existing
- ✓ Headcount budget analysis — existing
- ✓ Vendor cost analysis — existing
- ✓ Accounts Receivable aging tracking — existing
- ✓ Dashboard visualizations for KPIs — existing

### Active

New capabilities to build for v1:

- [x] Customer account plan creation with rich intelligence (financial metrics, health indicators, strategic context, action items)
- [x] Account plan management for 140 customers across three BUs (8-tab: Overview, Financials, Organization, Strategy, Competitive, Intelligence, Action Items, Chat)
- [x] Organization structure mapping within account plans
- [x] Pain point and opportunity tracking per account
- [x] Competitive intelligence (competitors for us and for the customer)
- [x] What-if scenario modeling for financial decisions (pricing, costs, margins)
- [x] What-if scenario modeling for headcount planning
- [x] What-if scenario modeling for customer scenarios (churn, acquisition, retention)
- [x] What-if scenario modeling for strategic pivots (divestiture, acquisition)
- [x] Real-time news integration for customer companies
- [x] Industry and competitive intelligence feeds
- [x] Market intelligence aggregation
- [x] Natural language querying of all business data
- [ ] Salesforce CRM integration
- [ ] Financial system integration (GL data)
- [ ] Notion Database integration
- [ ] Unified data view across all sources

### Out of Scope

- User authentication and permissions system — deferred to post-demo (demo is single-user)
- Full automation of data refresh — deferred to post-demo (manual refresh acceptable for demo)
- Mobile-specific optimization — focus on desktop web first
- Historical time-series analysis — focus on current state intelligence
- Real-time streaming data — acceptable to have periodic refresh for demo

## Context

**Business Structure:**
- Multi-business unit SaaS company with three verticals
- Cloudsense: Largest BU (~$8M quarterly revenue)
- Kandy: Mid-size BU (~$3.3M quarterly revenue)
- STL (Software Technology Labs): Smaller BU (~$1M quarterly revenue)
- 140 customers across all business units

**Current State:**
- Using Excel budget files for financial planning (Q1'26 budget structure)
- Static HTML dashboard requiring manual updates
- Multiple disconnected tools and data sources
- Manual data gathering and analysis workflows
- Existing financial models: ARR calculations, margin tracking, cost structure analysis

**Critical Metrics:**
- EBITDA (currently failing FY'25 test)
- Recurring Revenue (RR) with $336K decline vs prior plan
- Net Margin (current: 62.5%, target: 68.7%)
- Accounts Receivable > 90 days ($1.28M at risk)
- Per-BU margin performance

**Users:**
- Executives (C-suite level - Todd and leadership team)
- Business Unit leaders (Cloudsense, Kandy, STL heads)
- Account managers (customer relationship owners)

**Existing Data Assets to Reuse:**
- Excel budget file structure and formulas
- Dashboard visualizations and KPI definitions
- Financial models (ARR, margin, cost calculations)
- 140 customer records and revenue relationships

## Constraints

- **Timeline**: 24-hour deadline for end-to-end demo — must demonstrate all capabilities, automation can be partial
- **Speed**: Speed is priority over API cost — use Claude extensively for intelligence
- **Intelligence**: Must use Claude for AI-powered analysis, insights, and natural language interaction
- **Quality Bar**: Demo-quality acceptable — focus on demonstrating capabilities over production perfection

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 24-hour demo timeline | Speed is critical for business needs, stakeholder engagement | Delivered — all 7 phases complete or in progress |
| Claude-powered intelligence | Leverage AI for insights, natural language query, real-time analysis | Implemented via ClaudeOrchestrator singleton (50 RPM, priority queue, cache) |
| Reuse existing data structures | Excel budget structure, financial models proven and familiar | Excel adapter live; semantic layer resolves ARR/EBITDA/NRR from existing fields |
| Skip auth for demo | Single-user demo sufficient to prove value | Auth deferred; on Phase 7 backlog |
| Parallel development approach | Use multiple agents/sessions to build all capabilities simultaneously | Used throughout; CI/CD added to gate quality on every PR |
| Editorial Datafeed design system | Professional, data-dense aesthetic befitting executive audience | Implemented — brick-red #C84B31 accent, Cormorant Garamond + DM Sans, CSS token vars |
| WCAG 2.2 compliance | Accessibility required for enterprise clients | 47 findings fixed in Phase 7 hardening (fix/pr-review-hardening branch) |

---
*Last updated: 2026-05-08 — Phase 7 Post-Launch Hardening in progress*
