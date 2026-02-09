# Requirements: Skyvera Business Intelligence Platform

**Defined:** 2026-02-08
**Core Value:** Executives and BU leaders can instantly understand business performance, customer health, and scenario impacts through AI-powered intelligence

## v1 Requirements

Requirements for 24-hour demo. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: System has semantic layer providing consistent metric definitions across data sources
- [ ] **FOUND-02**: System has Claude API orchestration with queue-based rate limiting
- [ ] **FOUND-03**: System validates data quality and reconciles conflicts between sources
- [ ] **FOUND-04**: System caches data with 15-minute TTL to prevent API rate limits
- [ ] **FOUND-05**: System handles errors gracefully with recovery strategies

### Account Planning

- [ ] **ACCT-01**: User can view account health score (red/yellow/green) for each customer
- [ ] **ACCT-02**: User can browse directory of 140 customers with search and filter
- [ ] **ACCT-03**: User can view financial metrics per account (ARR, NRR, margin)
- [ ] **ACCT-04**: User can view organization structure and stakeholder mapping per account
- [ ] **ACCT-05**: User can track pain points and opportunities per account
- [ ] **ACCT-06**: User can manage action plans per account
- [ ] **ACCT-07**: User receives Claude-generated strategic insights for each account
- [ ] **ACCT-08**: User sees real-time news and intelligence for customer companies
- [ ] **ACCT-09**: User can navigate 7-tab comprehensive account plan interface
- [ ] **ACCT-10**: User can view competitive intelligence (competitors for us and for customer)

### Scenario Modeling

- [ ] **SCEN-01**: User can model financial scenarios (pricing, cost, margin changes)
- [ ] **SCEN-02**: User can model headcount scenarios (hiring, org changes)
- [ ] **SCEN-03**: User can model customer scenarios (churn, acquisition impact)
- [ ] **SCEN-04**: User receives Claude-powered impact analysis for what-if scenarios

### Natural Language Query

- [ ] **NLQ-01**: User can select from pre-programmed query library (5-10 canned queries)
- [ ] **NLQ-02**: User can ask free-form natural language questions about business data
- [ ] **NLQ-03**: User can browse curated metrics catalog to build queries

### Dashboard & Reporting

- [ ] **DASH-01**: User views enhanced financial KPI dashboard with multi-BU breakdown
- [ ] **DASH-02**: User views proactive alerts dashboard showing at-risk accounts and anomalies

### Data Integration

- [ ] **DATA-01**: System imports and parses Excel budget files
- [ ] **DATA-02**: System integrates with NewsAPI.ai for real-time business intelligence

## v2 Requirements

Deferred to post-demo. Tracked but not in current roadmap.

### Data Integration

- **DATA-03**: System integrates with Salesforce CRM for customer relationships and opportunities
- **DATA-04**: System integrates with Notion Database for internal data
- **DATA-05**: System integrates with Financial system for GL data

### Dashboard & Reporting

- **DASH-03**: System refreshes data automatically every 15 minutes
- **DASH-04**: User can export dashboards and reports to PDF/Excel

### Account Planning

- **ACCT-11**: System sends proactive alerts when account health changes

### Authentication & Access

- **AUTH-01**: User can log in with credentials
- **AUTH-02**: User sees role-appropriate views (Executive, BU Leader, Account Manager)
- **AUTH-03**: System tracks user activity and audit logs

## Out of Scope

Explicitly excluded for 24-hour demo. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User authentication & permissions | Single-user demo sufficient to prove value - defer to post-demo |
| Full automation of data refresh | Manual refresh acceptable for demo - saves integration complexity |
| Historical time-series analysis | Focus on current state intelligence - defer trend analysis |
| Mobile-optimized interface | Desktop web demo sufficient - defer mobile optimization |
| Real-time streaming data | 15-minute cache refresh acceptable - saves WebSocket complexity |
| Custom dashboard builder | Role-based templates sufficient - custom builders have 60-80% unused rate |
| 100+ KPI metrics | Research shows 3-5 KPIs per view optimal - information overload otherwise |
| Complete data history | Storage costs and analysis paralysis - focus on actionable current data |
| Unlimited scenario variants | Cap at 5 saved scenarios - prevents decision fatigue |
| Multi-language support | English-only demo - defer internationalization |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | TBD | Pending |
| FOUND-02 | TBD | Pending |
| FOUND-03 | TBD | Pending |
| FOUND-04 | TBD | Pending |
| FOUND-05 | TBD | Pending |
| ACCT-01 | TBD | Pending |
| ACCT-02 | TBD | Pending |
| ACCT-03 | TBD | Pending |
| ACCT-04 | TBD | Pending |
| ACCT-05 | TBD | Pending |
| ACCT-06 | TBD | Pending |
| ACCT-07 | TBD | Pending |
| ACCT-08 | TBD | Pending |
| ACCT-09 | TBD | Pending |
| ACCT-10 | TBD | Pending |
| SCEN-01 | TBD | Pending |
| SCEN-02 | TBD | Pending |
| SCEN-03 | TBD | Pending |
| SCEN-04 | TBD | Pending |
| NLQ-01 | TBD | Pending |
| NLQ-02 | TBD | Pending |
| NLQ-03 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0 (awaiting roadmap creation)
- Unmapped: 27 ⚠️

---
*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 after initial definition*
