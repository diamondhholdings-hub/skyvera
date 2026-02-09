# Feature Landscape

**Domain:** Business Intelligence Platform with Account Planning and Scenario Modeling
**Researched:** 2026-02-08
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Financial KPI Dashboard** | Core BI expectation - executives need revenue, margin, EBITDA at-a-glance | LOW | Already exists in codebase (Business_Analysis_Dashboard.html) |
| **Multi-BU Revenue Breakdown** | Essential for multi-division companies like Skyvera (3 BUs) | LOW | Already exists - Cloudsense, Kandy, STL tracking |
| **Account Health Scoring** | Standard in account management tools - single risk indicator per account | MEDIUM | Combine usage, engagement, support, financial metrics into single score |
| **Basic Data Visualization** | Charts/graphs are baseline BI feature - users expect interactive charts | LOW | Already exists - Chart.js implementation |
| **Customer List/Directory** | Fundamental account planning feature - browse/search customers | LOW | Already exists - 140+ customer pages generated |
| **Financial Trend Analysis** | Compare periods (QoQ, YoY) - standard in all BI platforms | LOW | Existing data structure supports this |
| **Filtering by Business Unit** | Multi-BU orgs expect BU-specific views | LOW | Already implemented in analytics.html |
| **Export to Excel/CSV** | Standard BI feature for exec presentations | LOW | Simple JSON to CSV conversion |
| **Role-Based Dashboards** | Different views for execs vs account managers vs analysts | MEDIUM | Requires user context, but layout templates exist |
| **Data Refresh Indicators** | Show when data was last updated - critical for trust | LOW | Timestamp display + last_updated metadata |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Natural Language Query** | "Show me at-risk accounts in APAC" - removes BI bottleneck, democratizes data | HIGH | Looker Conversational Analytics pattern - requires LLM + semantic layer |
| **Real-Time News Intelligence** | Auto-fetch customer news/events for account context | MEDIUM | Scripts exist (fetch_customer_news.py) - integrate into dashboards |
| **AI-Powered What-If Scenarios** | "What if churn increases 2%?" with instant model updates | HIGH | Scenario-lab.html exists - enhance with conversational interface |
| **Proactive Anomaly Detection** | AI monitors KPIs, alerts when metrics deviate | MEDIUM | ML-based threshold detection on time-series data |
| **Customer Intelligence Synthesis** | Auto-generate account context from multiple sources | MEDIUM | Existing: generate_customer_intelligence.py - enhance visibility |
| **Cross-Account Pattern Recognition** | "Accounts like Telstra that are expanding" - cohort analysis | HIGH | Requires ML clustering + feature engineering |
| **Predictive Health Score** | Not just current health, but forecast 90-day risk | HIGH | Time-series forecasting on engagement/usage metrics |
| **Stakeholder Network Mapping** | Visualize decision-maker relationships within accounts | MEDIUM | Relationship graph visualization - valuable for sales strategy |
| **Embedded Analytics in Email** | KPIs in daily digest emails, not just dashboards | LOW | Chart images + summary stats in automated emails |
| **Conversational Scenario Planning** | Plain-English commands: "Build cash flow scenario with 5% revenue drop" | HIGH | Prophix/Planful pattern - LLM interprets intent, modifies financial models |
| **Automatic Insight Generation** | "Cloudsense margin declined 2.3% due to Salesforce UK contract" | HIGH | ML attribution analysis + NLG for explanations |
| **Customer Journey Timeline** | Visual timeline of account milestones, contract renewals, expansion events | MEDIUM | Chronological visualization of account history |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time Everything** | "We want live data" - sounds impressive | Creates decision fatigue, expensive infra, meaningless for quarterly planning | **Daily/Weekly Refresh** - Match refresh to decision cadence (execs don't need intraday volatility) |
| **Unlimited Custom Dashboards** | Users want personalized views | Dashboard sprawl - 60-80% go unused, inconsistent metrics, maintenance nightmare | **3-5 Role-Based Templates** - Executive, Account Manager, Analyst views with minor customization |
| **100+ KPIs on One Screen** | "Show everything important" | Information overload - nothing stands out, decision paralysis | **3-5 Key Metrics per View** - Prioritize ruthlessly, link to detail pages |
| **Pixel-Perfect Reporting** | "Match existing Excel format exactly" | Stifles innovation, locks in legacy bad UX, over-engineering | **Executive-Ready Export** - Clean, branded export but modern dashboard UX |
| **Complete Data History** | "We might need it someday" | Storage costs, performance degradation, analysis paralysis | **Rolling 24-Month Window** - Archive older data, focus on actionable timeframes |
| **Dozens of Scenario Types** | "Model every possible future" | Scope creep, user confusion, 90% scenarios never used | **3 Core Scenarios** - Base/Optimistic/Pessimistic + 1-2 custom slots |
| **Full OLAP Drill-Down** | "Let users explore any dimension" | Requires data warehouse, breaks mobile, users get lost in data | **Curated 2-Level Drill** - Summary → Detail → Stop. Guided exploration. |
| **Social/Collaboration Features** | "Add comments and @mentions" | Becomes another tool users ignore, moderation overhead | **Export + Existing Tools** - Use Slack/Teams for discussion, BI for data |
| **Mobile App** | "Access on phone" | Complex BI doesn't work on 6" screen, dev/maintenance burden for 24-hour demo | **Responsive Web** - Mobile-friendly web UI for key metrics only |
| **Custom Calculated Metrics** | "Let users create their own KPIs" | Metric inconsistency, broken formulas, governance nightmare | **Request New Metrics** - Curated metric library, admins add validated calculations |

## Feature Dependencies

```
Core Data Platform (exists)
    └──requires──> Financial KPI Dashboard (exists)
                       ├──requires──> Multi-BU Revenue Breakdown (exists)
                       ├──requires──> Account Health Scoring
                       └──requires──> Financial Trend Analysis

Customer Directory (exists)
    └──requires──> Customer Intelligence Synthesis (partial)
                       ├──enhances──> Real-Time News Intelligence (scripts exist)
                       └──enables──> Account Health Scoring

What-If Scenario Engine (exists: scenario-lab.html)
    ├──enhances──> Conversational Scenario Planning
    └──requires──> Financial Model Foundation (exists)

Natural Language Query
    ├──requires──> Semantic Layer (data model understanding)
    ├──requires──> LLM Integration
    └──conflicts──> Unlimited Custom Dashboards (NLQ replaces need for custom dashboards)

Proactive Anomaly Detection
    ├──requires──> Financial Trend Analysis
    ├──enables──> Automatic Insight Generation
    └──enhances──> Account Health Scoring

Cross-Account Pattern Recognition
    ├──requires──> Customer Directory
    ├──requires──> Account Health Scoring
    └──enables──> Predictive Health Score
```

### Dependency Notes

- **NLQ conflicts with Custom Dashboards:** If users can ask "Show me at-risk APAC accounts," they don't need to build custom dashboards. NLQ is higher ROI.
- **Account Health Score is foundational:** Multiple differentiators (predictive health, pattern recognition, anomaly detection) depend on establishing base health scoring.
- **News Intelligence enhances existing features:** Scripts exist (fetch_customer_news.py) - integration into account pages is low-hanging fruit.
- **Scenario Engine foundation exists:** scenario-lab.html provides base - conversational interface is enhancement, not rewrite.

## MVP Definition (24-Hour Demo Context)

### Launch With (Demo Must-Haves)

Critical features for convincing 24-hour demo. Missing these = demo falls flat.

- [x] **Financial KPI Dashboard** - Already exists, polish for demo
- [x] **Multi-BU Revenue Breakdown** - Already exists
- [x] **Customer Account Pages** - 140+ exist, select top 10-15 for demo data
- [x] **What-If Scenario Lab** - Already exists (scenario-lab.html), enhance UX
- [ ] **Account Health Scoring** - MUST ADD - single score per account (red/yellow/green)
- [ ] **Real-Time News Intelligence Integration** - Scripts exist, surface on account pages
- [ ] **Proactive Alerts Dashboard** - "3 accounts at risk, Salesforce contract renewal in 30 days"
- [ ] **Natural Language Query (Basic)** - 5-10 pre-programmed queries to simulate conversational BI
- [ ] **Embedded Customer Intelligence** - Surface generate_customer_intelligence.py output in UI

**Rationale:** Demo needs to show "AI-powered business intelligence" - not just dashboards. Health scoring + news + NLQ (even if limited) = differentiation story.

### Add After Demo Validation (v1.x)

Features to add if demo converts to real project.

- [ ] **Conversational Scenario Planning** - Full LLM integration for what-if modeling
- [ ] **Predictive Health Score** - 90-day risk forecasting with ML
- [ ] **Automatic Insight Generation** - "Margin declined because..." explanations
- [ ] **Role-Based Dashboard Templates** - Executive/Account Manager/Analyst views
- [ ] **Cross-Account Pattern Recognition** - "Accounts like this one" cohort analysis
- [ ] **Export to Excel/PowerPoint** - Branded executive-ready exports
- [ ] **Customer Journey Timeline** - Visual account history on account pages

**Trigger for adding:** User requests during demo or post-demo feedback prioritizes these.

### Future Consideration (v2+)

Features to defer - interesting but not essential for initial success.

- [ ] **Stakeholder Network Mapping** - Relationship graphs within accounts
- [ ] **Embedded Analytics in Email** - Daily digest emails with KPIs
- [ ] **Multi-Scenario Comparison** - Side-by-side scenario analysis
- [ ] **Advanced Cohort Analysis** - Deep segmentation and clustering
- [ ] **API for External Integration** - Connect to Salesforce, Notion, etc.
- [ ] **Audit Trail and Version History** - Track who changed what when
- [ ] **White-Label Customization** - Rebrand for different audiences

**Why defer:** These are "nice-to-haves" that don't impact demo success. Build if product gains traction.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Demo Impact |
|---------|------------|---------------------|----------|-------------|
| Account Health Scoring | HIGH | MEDIUM | P1 | HIGH - differentiator |
| Real-Time News Integration | HIGH | LOW | P1 | HIGH - shows "intelligence" |
| Proactive Alerts Dashboard | HIGH | MEDIUM | P1 | HIGH - proactive vs reactive story |
| Natural Language Query (Basic) | HIGH | MEDIUM | P1 | CRITICAL - "AI-powered" proof point |
| Embedded Customer Intelligence | MEDIUM | LOW | P1 | MEDIUM - uses existing scripts |
| Financial KPI Dashboard Polish | HIGH | LOW | P1 | MEDIUM - already exists, minor UX improvements |
| Conversational Scenario Planning | HIGH | HIGH | P2 | MEDIUM - scenario-lab exists, this enhances it |
| Predictive Health Score | HIGH | HIGH | P2 | MEDIUM - health scoring must exist first |
| Automatic Insight Generation | MEDIUM | HIGH | P2 | LOW - impressive but time-consuming |
| Customer Journey Timeline | MEDIUM | MEDIUM | P2 | LOW - visual appeal but not core value |
| Export to Excel/PowerPoint | MEDIUM | LOW | P2 | LOW - users expect it but not demo-critical |
| Stakeholder Network Mapping | MEDIUM | MEDIUM | P3 | LOW - specialized use case |
| Cross-Account Pattern Recognition | MEDIUM | HIGH | P3 | LOW - requires substantial ML work |
| Embedded Analytics in Email | LOW | MEDIUM | P3 | LOW - delivery mechanism, not core insight |

**Priority key:**
- P1: Must have for 24-hour demo - builds "AI-powered BI" narrative
- P2: Should have post-demo - validates with real usage
- P3: Nice to have - future roadmap based on adoption

## Competitor Feature Analysis

| Feature | Tableau/Power BI | Gainsight (CS) | Looker | Our Approach |
|---------|------------------|----------------|--------|--------------|
| **Financial Dashboards** | ✅ Best-in-class | ❌ Limited | ✅ Strong | ✅ Existing - leverage Skyvera financial data |
| **Account Health Scoring** | ❌ None | ✅ Core feature | ❌ None | ✅ Combine BI + CS patterns - hybrid approach |
| **Natural Language Query** | ⚠️ Basic (NLQ) | ❌ None | ✅ Conversational Analytics (GA 2026) | ✅ Follow Looker pattern - LLM + semantic layer |
| **What-If Scenarios** | ⚠️ Manual parameters | ❌ None | ❌ None | ✅ Conversational interface - "what if churn increases 2%?" |
| **Real-Time News** | ❌ None | ❌ None | ❌ None | ✅ UNIQUE - fetch_customer_news.py integration |
| **Customer Intelligence** | ❌ None | ⚠️ Manual notes | ❌ None | ✅ UNIQUE - AI synthesis from multiple sources |
| **Proactive Anomaly Detection** | ⚠️ Alerting exists | ✅ Health trends | ⚠️ Looker Alerts | ✅ AI-powered continuous monitoring |
| **Multi-BU Consolidation** | ✅ Strong | ❌ Single-tenant focus | ✅ Strong | ✅ Native - Skyvera has 3 BUs, built-in support |

**Competitive Positioning:**

- **vs Tableau/Power BI:** We're not a generic BI tool - we're business management platform. BI tools lack account context and customer intelligence.
- **vs Gainsight:** We include financial planning and what-if scenarios. CS tools focus on engagement, not executive financial decisions.
- **vs Looker:** We combine BI + account planning + scenario modeling in one platform. Looker is BI-only, requires separate tools for account management.

**Unique Value:** Hybrid BI + Customer Success + Financial Planning platform with AI intelligence layer. No competitor offers all three.

## Feature Complexity Assessment

### Low Complexity (Hours to 1-2 Days)

- Financial dashboard polish (existing code)
- Real-time news integration (scripts exist, add UI)
- Embedded customer intelligence (scripts exist, surface output)
- Data refresh indicators
- Export to CSV
- Filtering by BU

### Medium Complexity (2-5 Days)

- Account health scoring (algorithm + visualization)
- Proactive alerts dashboard (rule engine + UI)
- Basic natural language query (pattern matching + pre-programmed queries)
- Customer journey timeline
- Role-based dashboards
- Stakeholder network mapping

### High Complexity (5+ Days)

- Full conversational NLQ (LLM integration + semantic layer)
- Conversational scenario planning (LLM intent parsing + model updates)
- Predictive health score (time-series ML)
- Automatic insight generation (ML attribution + NLG)
- Cross-account pattern recognition (clustering + feature engineering)

**24-Hour Demo Strategy:** Focus on Low + selective Medium complexity features. Use "Wizard of Oz" approach for High complexity features (pre-programmed demos that look like AI).

## Sources

### Business Intelligence Platforms (2026)
- [Top Business Intelligence Platforms of 2026](https://www.knowledgehut.com/blog/business-intelligence-and-visualization/business-intelligence-platform) - Core BI features, AI integration trends
- [Gartner Analytics and Business Intelligence Platforms Reviews 2026](https://www.gartner.com/reviews/market/analytics-business-intelligence-platforms) - Market standards
- [6 BI Trends in 2026: Smarter, faster and AI-driven](https://sigmoidanalytics.medium.com/6-bi-trends-in-2026-smarter-faster-and-ai-driven-53ecf2e0abba) - AI integration, governance trends
- [Top 17 BI Tools for Modern Analytics in 2026](https://www.integrate.io/blog/top-business-intelligence-tools/) - Feature comparison

### Account Planning Software (2026)
- [16 Best Account Planning Software Reviewed in 2026](https://thecmo.com/tools/best-account-planning-software/) - Table stakes features
- [Account planning Tools & Strategies for Growth](https://www.mural.co/blog/account-planning-tools-strategies-and-solutions-for-growth) - Best practices
- [Gartner Account-Planning Tools Reviews 2026](https://www.gartner.com/reviews/market/account-planning-tools) - Market expectations
- [5 Things to Look for in a Strategic Account Planning Software](https://kapta.com/resources/key-account-management-blog/5-things-to-look-for-in-a-strategic-account-planning-software) - Feature priorities

### What-If Scenario Modeling (2026)
- [The 6 Best Financial Modelling Software for Businesses in 2026](https://www.fathomhq.com/blog/the-6-best-financial-modelling-software-tools) - Scenario modeling capabilities
- [Scenario Modeling 101: A Framework for Strategic Financial Planning](https://blog.workday.com/en-us/scenario-modeling-101-framework-strategic-financial-planning.html) - Best practices
- [18 Best Scenario Planning Software Reviewed in 2026](https://thecfoclub.com/tools/best-scenario-planning-software/) - Feature comparison
- [Top 6 Scenario Planning Software & Tools in 2026](https://productive.io/blog/scenario-planning-software/) - Market overview

### Executive Dashboards & KPIs (2026)
- [Executive Dashboards: 13+ Examples, Templates & Best Practices](https://improvado.io/blog/executive-dashboards) - Design principles
- [Business Intelligence Dashboard in 2026: What Is It & How to Use](https://www.yellowfinbi.com/blog/business-intelligence-dashboard-what-is-it-how-to-use) - Table stakes features
- [How Many KPIs go on an Executive Dashboard?](https://dashthis.com/blog/how-many-kpis-go-on-an-executive-dashboard/) - 3-10 KPIs optimal

### Natural Language Query & Conversational Analytics (2026)
- [Looker Conversational Analytics now GA](https://cloud.google.com/blog/products/business-intelligence/looker-conversational-analytics-now-ga/) - Industry standard approach
- [10 AI-Powered BI Tools: A Fact-Based Comparison Matrix (2026)](https://www.holistics.io/bi-tools/ai-powered/) - NLQ capabilities
- [Why Conversational BI is the Next Big Shift in Data Analytics](https://www.quadratichq.com/blog/why-conversational-bi-is-the-next-big-shift-in-data-analytics) - Market trends

### Customer Health Scores (2026)
- [Customer Success Metrics: What to Track in 2026](https://www.gainsight.com/blog/customer-success-metrics-what-to-track-in-2026/) - Health score best practices
- [What Is a Customer Health Score: Complete Guide](https://www.withrealm.com/blog/what-is-customer-health-score) - Implementation patterns
- [CSM Tools: 15 Best Customer Success Platforms for 2026](https://www.usepylon.com/blog/csm-tools-2026) - Feature comparison

### Dashboard Design & Anti-Patterns (2026)
- [26 Business Intelligence Dashboard Design Best Practices 2025](https://julius.ai/articles/business-intelligence-dashboard-design-best-practices) - Common mistakes
- [Learn 25 Dashboard Design Principles & BI Best Practices](https://www.rib-software.com/en/blogs/bi-dashboard-design-principles-best-practices) - Information overload anti-pattern
- [10 Dashboard Design Principles and Best Practices](https://www.techtarget.com/searchbusinessanalytics/tip/Good-dashboard-design-8-tips-and-best-practices-for-BI-teams) - Visual hierarchy

### Scope Management & MVP Definition
- [The MVP Checklist for 2026: Features You Must Build vs. Ones to Skip](https://thesoftix.com/saas-mvp-checklist-2026-build-vs-skip/) - MVP feature selection
- [Top Five Causes of Scope Creep](https://www.pmi.org/learning/library/top-five-causes-scope-creep-6675) - Anti-feature rationale
- [What is scope creep and how to avoid it](https://business.adobe.com/blog/basics/scope-creep) - Project management

---

*Feature research for: Business Intelligence Platform with Account Planning and Scenario Modeling*
*Researched: 2026-02-08*
*Confidence: HIGH (multiple authoritative sources, cross-verified with existing codebase)*
