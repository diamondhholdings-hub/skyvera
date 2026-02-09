# Pitfalls Research

**Domain:** Business Intelligence Platform with AI, Account Planning, Scenario Modeling, and Real-Time Data Integration
**Researched:** 2026-02-08
**Confidence:** HIGH (verified from multiple 2026 sources + domain expertise)

## Critical Pitfalls

These mistakes can make the demo fail or create unfixable architectural problems within the 24-hour timeline.

### Pitfall 1: Unreliable AI Outputs Breaking User Trust

**What goes wrong:**
Claude API generates plausible but incorrect insights, financial calculations, or scenario predictions. Users see wrong numbers in account plans or scenario models, immediately losing trust in the entire platform. According to KPMG research, 66% of employees rely on AI output without validating accuracy and 56% report making mistakes because of it.

**Why it happens:**
Under time pressure, developers skip validation layers and let Claude's outputs go directly to users. Vague prompts like "analyze this data" without constraints cause Claude to hallucinate specifics. No verification of financial calculations or scenario math against source data.

**How to avoid (24-hour optimized):**
- Add explicit prompt constraints: "If unsure, say 'Insufficient data' - never guess financial numbers"
- Structure every Claude prompt: Context → Constraints → Output format → Verification checklist
- For financial calculations: Claude generates formulas/logic, but actual math happens in code with validation
- For scenarios: Show data sources and assumptions alongside AI insights (transparency prevents blind trust)
- Quick validation: Compare AI-generated ARR/margin numbers against known Excel baseline in first test

**Warning signs:**
- Claude responses vary significantly between identical queries
- Financial totals don't match Excel source data
- Scenario predictions seem overly optimistic or pessimistic without justification
- Account health scores change dramatically with minor data changes

**Phase to address:**
Phase 1 (Foundation) - Build verification layer from start. Set up prompt templates with constraints before any feature work.

**Demo impact if not handled:**
DEMO BREAKER. Executive sees wrong EBITDA or margin calculation, demo credibility destroyed instantly.

---

### Pitfall 2: API Rate Limits and Performance Bottlenecks in Demo

**What goes wrong:**
During demo, Salesforce API hits 100,000 daily request limit and fails. Claude API times out on complex prompts. Dashboard loads slowly or hangs. Excel file parsing takes 30+ seconds. Demo freezes at critical moment.

**Why it happens:**
- Salesforce: 100,000 API requests/24hrs base + 1,000 per user license. Bulk operations hit 15,000 batch/day limit.
- Claude API: Long context (Excel data + account history + scenario parameters) causes 30-60 second response times
- Real-time data fetching: Each dashboard widget independently calls external APIs creating N+1 query problem
- Excel parsing: Reading large budget file synchronously blocks UI

**How to avoid (24-hour optimized):**
- **Salesforce**: Use Bulk API for initial data load, cache results. For demo, pre-load 140 customer records into local cache, refresh only on demand
- **Claude API**: Pre-generate common insights during data load. Cache Claude responses aggressively (same query → cached result for demo duration). Use streaming for long operations
- **Excel parsing**: Parse once at startup, store in memory or SQLite. Show loading indicator, never block UI
- **Dashboard**: Load critical widgets first, lazy-load secondary data. Pre-fetch during navigation to next screen
- **Rate limit monitoring**: Track API calls, fail gracefully with cached data if limit approaching

**Warning signs:**
- Initial page load takes >5 seconds
- Multiple concurrent API calls visible in network inspector
- Same Claude prompt sent multiple times for same data
- Excel file re-parsed on every page navigation
- No loading states or progress indicators

**Phase to address:**
Phase 2 (Data Integration) - Implement caching strategy and async loading patterns before connecting real APIs.

**Demo impact if not handled:**
DEMO BREAKER. 30-second hang while switching between accounts destroys flow. "Let me try that again" = lost credibility.

---

### Pitfall 3: Data Quality and Integration Inconsistencies

**What goes wrong:**
Account plan shows $8M ARR for Cloudsense, but Excel budget file shows $6.4M. Customer health score changes when viewing from different tabs. Scenario modeling uses stale financial data. Dashboard metrics don't match manual Excel calculations. Data from Salesforce, Excel, and Notion contradict each other.

**Why it happens:**
Research shows 90% of spreadsheets contain errors affecting results. Multiple sources of truth (Excel, Salesforce, Notion) with no reconciliation logic. Date/time mismatches (fiscal quarters vs calendar quarters). Currency and unit inconsistencies (thousands vs millions). No data validation on import. Last-modified timestamps ignored causing stale data display.

**How to avoid (24-hour optimized):**
- **Single source of truth per metric**: Define in code which system is authoritative (Excel for budgets, Salesforce for customer data, etc.)
- **Data validation on import**: Check ranges, data types, required fields. Log validation errors, don't silently skip bad data
- **Reconciliation dashboard**: Show data freshness timestamps, source system, last sync time for every metric
- **Financial calculations**: Store formula logic alongside values. Document "ARR = Quarterly RR × 4" explicitly
- **Test with real data early**: Use actual Skyvera Excel file and real customer records by Hour 4, not fake data

**Warning signs:**
- Different parts of UI show different values for same metric
- Totals don't sum correctly
- Negative values where only positive makes sense (revenue, headcount)
- Missing data displayed as zero instead of "N/A"
- No indication of data freshness or source

**Phase to address:**
Phase 2 (Data Integration) - Build data validation and reconciliation from start, not as cleanup later.

**Demo impact if not handled:**
DEMO BREAKER. Executive spots inconsistency: "Wait, that number is wrong" → entire platform credibility questioned.

---

### Pitfall 4: Scenario Modeling Producing Unrealistic Outputs

**What goes wrong:**
What-if scenarios generate impossible outcomes: negative headcount, 200% margins, revenue declining while all inputs increase. Baseline assumptions are flawed. Scenarios aren't truly distinct (best case = baseline + 5%). No validation of scenario logic. Research shows 42% of forecasts miss targets by >10%, and McKinsey found 40% of scenarios are ineffective because they prioritize unlikely events.

**Why it happens:**
Under time pressure, scenario formulas copy Excel directly without validation. Circular dependencies in financial models. Weak scenario differentiation - best/worst cases are just baseline ± small percentage. No bounds checking on outputs. Cognitive bias in assumption selection.

**How to avoid (24-hour optimized):**
- **Start with Excel formulas that work**: Use proven budget file calculations, don't reinvent
- **Implement bounds checking**: Revenue 0-2x baseline, margins 0-100%, headcount integer ≥ 0
- **Scenario validation logic**: Before displaying results, check if outputs make business sense
- **Clear assumptions**: Every scenario shows explicit inputs (e.g., "Assumes 10% churn, 5 new customers, 15% price increase")
- **Narrative-driven scenarios**: Name scenarios by story ("Lost major customer", "New product launch") not just "Pessimistic"
- **Limit scenario count**: 3-5 meaningful scenarios, not 20 variations

**Warning signs:**
- Scenario outputs violate business logic (negative cash, >100% growth in one quarter)
- All scenarios produce similar results (insufficient differentiation)
- Can't explain why scenario produced specific outcome
- Scenarios missing key assumptions or drivers
- No baseline/control scenario to compare against

**Phase to address:**
Phase 4 (Scenario Modeling) - Build validation rules first, then scenario logic. Test with extreme inputs.

**Demo impact if not handled:**
CREDIBILITY DAMAGE. Unrealistic scenario outputs make platform look amateurish. "This can't happen in real life" → trust lost.

---

### Pitfall 5: Claude Prompt Engineering Failures Under Load

**What goes wrong:**
Prompts that worked in testing fail in demo with real data. Claude responses take 45+ seconds. Outputs are inconsistent - same data produces different insights on repeated queries. Claude hits context limits with large Excel files. Vague prompts cause hallucination. No error handling when Claude API fails.

**Why it happens:**
2026 research shows common mistakes: hallucination from vague instructions, lack of output specifications, unstructured prompts mixing context/constraints/format, over-constraining with complex roles. Under time pressure, prompts aren't tested with production-scale data. Context limits (200K tokens) exceeded when sending full Excel file + customer history + scenario parameters.

**How to avoid (24-hour optimized):**
- **Structured prompt template**:
  ```
  CONTEXT: [relevant data only]
  CONSTRAINTS: [what NOT to do, output limits]
  OUTPUT FORMAT: [exact structure, length, JSON schema]
  VERIFICATION: [what to check before responding]
  ```
- **Explicit uncertainty handling**: "If unsure or data insufficient, respond with: {error_type: 'insufficient_data', message: '...'}"
- **Output specifications**: "Summarize in exactly 3 bullet points, each under 20 words" not "give me a summary"
- **Context management**: Don't send full Excel file - extract relevant rows/columns only. Pre-process data before Claude call
- **Caching strategy**: Identical prompts → cache response for 5 minutes. Use Claude's prompt caching for repeated context
- **Error handling**: Timeout after 30 seconds, retry once, then show cached/fallback data
- **Test with production data**: Try prompts with actual Skyvera budget file by Hour 6

**Warning signs:**
- Claude responses taking >30 seconds
- Different insights for identical data
- Generic responses lacking specifics from input data
- Error messages with no fallback behavior
- Prompts mixing instructions, data, and examples without structure

**Phase to address:**
Phase 1 (Foundation) - Create prompt templates and testing framework before any AI features.

**Demo impact if not handled:**
DEMO FLOW KILLER. Long pauses waiting for Claude destroy momentum. Inconsistent outputs look buggy.

---

### Pitfall 6: Natural Language Query Misinterpretation

**What goes wrong:**
User asks "Show me our top customers" and gets wrong results (sorted by name not revenue). Ambiguous queries produce incorrect data or hallucinated responses. Query: "What's our margin?" → System doesn't know if user means gross, net, or operating margin, or which BU. Modern LLMs achieve 85-95% accuracy for common queries but drop significantly for complex/ambiguous questions.

**Why it happens:**
Natural language is inherently ambiguous. No clarification dialogue for low-confidence interpretations. Direct SQL generation from NL without semantic layer causes reliability issues. Missing business context (user's role, current page) in query interpretation.

**How to avoid (24-hour optimized):**
- **Use semantic layer approach**: Map common business terms to specific metrics beforehand
  - "margin" → Net Margin % (from P&L sheet)
  - "top customers" → sorted by Quarterly RR descending
  - "at risk" → AR > 90 days OR declining RR
- **Clarification for ambiguity**: If confidence <85%, ask: "Did you mean: [option A] or [option B]?"
- **Context-aware interpretation**: Same query means different things in Cloudsense tab vs. Kandy tab
- **Curated metrics catalog**: Pre-define 20-30 core queries that cover 80% of needs
- **Show interpretation**: Display "Showing: Top 10 customers by Quarterly RR (Cloudsense only)" so user can verify
- **Graceful failure**: "I don't understand '[complex query]'. Try: [example query 1], [example query 2]"

**Warning signs:**
- Same query produces different results in different contexts
- No feedback showing how query was interpreted
- Complex queries fail silently or return no results
- No suggestions for alternative queries
- System guesses instead of asking for clarification

**Phase to address:**
Phase 5 (Natural Language Query) - Build semantic layer and metrics catalog before NL interface. Test with real questions from Todd/BU leaders.

**Demo impact if not handled:**
DEMO CONFUSER. Wrong results from NL query make platform look unreliable. Better to limit NL scope than do it poorly.

---

### Pitfall 7: "Looks Done But Isn't" - Missing Critical Edge Cases

**What goes wrong:**
Happy path works great in demo, but edge cases crash the app: customer with no revenue data, account with missing Salesforce ID, Excel sheet with unexpected format, division by zero in margin calculation, null values displayed as "undefined", date parsing failures.

**Why it happens:**
Time pressure causes focus on happy path only. Testing with clean sample data, not messy production data. No defensive programming for null/undefined/missing. Form validations skipped. Error states not designed or implemented.

**How to avoid (24-hour optimized):**
- **Test with real data by Hour 6**: Use actual Skyvera Excel file with all its quirks, real 140 customer records including edge cases
- **Defensive programming checklist**:
  - Null checks before accessing properties: `customer?.name ?? 'Unknown'`
  - Array empty checks before accessing: `if (arr.length > 0)`
  - Division by zero: `total === 0 ? 'N/A' : (value / total)`
  - Date parsing: Use library (date-fns), validate before displaying
  - API failures: Always have fallback/error state
- **Handle missing data gracefully**: Display "No data" not "undefined" or "NaN"
- **Form validation**: Required fields, number ranges, date formats validated before submission
- **Error boundaries**: Catch React errors, show error UI instead of white screen

**Warning signs:**
- "undefined" or "NaN" visible in UI
- Console shows errors but UI looks fine
- Crashes when switching between accounts
- No loading/error states for async operations
- Successful demo with sample data, crashes with production data

**Phase to address:**
Every phase - Build error handling and validation as features are built, not as cleanup phase.

**Demo impact if not handled:**
DEMO STOPPER. One crash during live demo is fatal. "Let me restart" = massive credibility loss.

---

## Technical Debt Patterns

Shortcuts that seem reasonable for 24-hour demo but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-code 140 customer list instead of dynamic loading | Fast implementation, no DB needed | Can't scale, requires code change to add customer | Acceptable for demo - plan migration to DB in Phase 2 |
| Store all data in memory/localStorage instead of database | No DB setup time, simple architecture | Data loss on refresh, can't share between users, size limits | Acceptable for single-user demo - plan DB for post-demo |
| Skip authentication/authorization | Saves 4-6 hours of dev time | Security risk, can't have multi-user | Acceptable for demo - MUST add before any pilot usage |
| Directly call external APIs from frontend | Simple architecture, no backend needed | Exposes API keys, rate limit issues, no caching | NEVER acceptable - build API proxy layer from start |
| Use mock data for some features | Saves integration time | Demo appears complete but isn't functional | Acceptable ONLY if clearly labeled "Mock Data" in UI |
| Inline all styles, no design system | Fast styling, no abstraction needed | Inconsistent UI, hard to change | Acceptable for demo - extract to design tokens for production |
| No automated tests | Saves 3-4 hours, faster iteration | Regressions during demo prep, fragile code | Acceptable for demo - add smoke tests for critical paths |
| Sync/blocking data operations | Simpler code, easier to debug | UI freezes, poor UX | Never acceptable - users notice and hate frozen UI |
| Parse Excel file on every page load | Simpler state management | Terrible performance | Never acceptable - parse once, cache in memory |
| No error logging or monitoring | Saves setup time | Can't debug issues during/after demo | Never acceptable - add basic console logging + error tracking |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Salesforce API** | Hitting 100K/day request limit with inefficient queries | Use Bulk API for initial load, cache aggressively, batch requests. Pre-load 140 customers at startup. Monitor API usage. |
| **Claude API** | Sending full Excel file (large context) on every query causing slow response | Pre-process: extract relevant data only. Use prompt caching for repeated context. Implement response caching for identical queries. |
| **Excel file parsing** | Parsing synchronously blocks UI thread for 5-30 seconds | Parse async with loading indicator. Parse once at startup, store in memory/SQLite. Show progress for large files. |
| **Notion API** | Rate limits (3 requests/second) and pagination complexity | Batch requests, implement rate limiting queue. Cache results. Use cursor-based pagination properly. |
| **Real-time data refresh** | Polling all sources every minute creates API storm | Smart refresh: only refresh visible data, use stale-while-revalidate pattern, implement exponential backoff. |
| **Multiple data sources** | No reconciliation when sources conflict (Salesforce revenue ≠ Excel budget) | Define source of truth per metric. Show data provenance. Implement reconciliation logic with clear rules. |
| **API key security** | Exposing keys in frontend code | Use backend proxy/API layer. Store keys in environment variables. Never commit keys to git. |
| **Error handling** | Silent failures or generic "Something went wrong" | Log specific errors. Show actionable messages. Implement graceful degradation with cached data. |
| **Time zones and dates** | Fiscal quarter calculation wrong, date parsing locale issues | Use date-fns or dayjs. Store/transfer dates in ISO format. Document timezone assumptions. Test with Skyvera's fiscal calendar. |
| **Currency and units** | Mixing thousands/millions (Excel shows $8,000K, UI shows $8M) | Standardize internal representation. Document units clearly. Use formatting functions consistently. |

## Performance Traps

Patterns that work at small scale but fail as usage grows or during demo pressure.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **N+1 API queries** | Dashboard makes 140 requests (one per customer) instead of 1 batch request | Batch API calls. Pre-fetch and cache. Load paginated data. | Immediately with 140 customers. 30+ second load time. |
| **No response caching** | Same Claude query asked repeatedly, paying full latency/cost each time | Implement cache with TTL (5-15 min for demo). Cache key = prompt hash. | During demo when navigating between views. |
| **Synchronous operations** | UI freezes during Excel parsing, API calls, data processing | Use async/await, Web Workers for heavy computation. Show loading states. | First time loading large Excel file. |
| **Memory leaks** | Browser memory grows, page slows down, eventual crash | Clean up event listeners, intervals, subscriptions. Use React cleanup in useEffect. | After 20+ minutes of demo, switching between accounts 30+ times. |
| **Rendering large lists** | Displaying all 140 customers without virtualization causes scroll lag | Use virtual scrolling (react-window). Paginate or implement infinite scroll. | With full customer list. Scroll feels janky. |
| **Unoptimized images/assets** | Dashboard loads slowly due to large images, unminified JS | Optimize images, lazy-load, use CDN. Minify/bundle JS. | First load, especially on slower connections. |
| **Sequential API calls** | Waiting for Salesforce → then Excel → then Notion instead of parallel | Use Promise.all() for independent requests. Load critical data first, lazy-load secondary. | Every page load takes 3x longer than necessary. |
| **Full re-renders** | Entire dashboard re-renders when one widget updates | Use React.memo, useMemo, useCallback. Optimize component tree. | Typing in search box causes 140-row table to re-render. |

## Security Mistakes

Domain-specific security issues beyond general web security (critical for any pilot/production use).

| Mistake | Risk | Prevention |
|---------|------|------------|
| **API keys in frontend code** | Keys stolen, unlimited access to Salesforce/Claude/Notion | Backend API proxy layer. Environment variables. Never commit keys. Rotate keys regularly. |
| **No data access control** | Any user can see all BUs, all customer data | Implement role-based access: BU leaders see only their BU. Account managers see only their accounts. (Defer to post-demo for MVP). |
| **Sensitive financial data in logs** | EBITDA, margin data exposed in client logs/error tracking | Sanitize logs. Use structured logging. Don't log PII/financial data in frontend. |
| **No audit trail** | Can't track who viewed/changed what data, scenario created by whom | Log key actions: scenario created, data exported, settings changed. (Defer to post-demo). |
| **Scenario modeling tampering** | Users could manipulate scenario inputs in browser devtools to make numbers look better | Validate scenario constraints server-side. Don't trust client calculations for critical metrics. |
| **Excel file upload without validation** | Malicious file upload, XXE attacks, parsing exploits | Validate file type, size, structure. Use well-tested parsing library. Scan for malware in production. |
| **CORS misconfiguration** | API accessible from any origin, potential abuse | Restrict CORS to specific domains. Use backend proxy instead of direct frontend calls. |
| **No rate limiting** | Users could abuse Claude API, costing thousands in API fees | Implement rate limiting per user/session. Set budget alerts. Cache responses aggressively. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No indication of data freshness** | User doesn't know if viewing current or stale data, makes wrong decisions | Show "Last updated: 2 minutes ago" with refresh button. Color-code stale data (>1 hour = yellow warning). |
| **Slow operations with no feedback** | User waits 30 seconds with no indication, thinks app is frozen | Loading states with progress: "Loading Salesforce data (2/3 complete)". Skeleton UI. Estimated time remaining. |
| **Overwhelming information density** | 50+ metrics on one dashboard, can't find what they need | Progressive disclosure: Show top 5 KPIs, "Show more" to expand. Customizable dashboard with drag-drop widgets. |
| **No explanation of AI insights** | Claude says "High churn risk" but user doesn't know why | Show reasoning: "High churn risk because: AR >90 days ($120K), RR declining 15% QoQ, no contact in 60 days". |
| **Missing data shown as errors** | Red error message when customer just has no recent activity | Distinguish missing data ("No activity") from error ("Failed to load"). Use neutral gray, not alarming red. |
| **Scenario results without context** | Shows "$2.3M EBITDA" but user doesn't know if that's good or bad | Show vs baseline: "+$450K (+24%) vs current plan". Color-code: green=improvement, red=decline. |
| **No undo for destructive actions** | User deletes scenario by accident, can't recover | Confirmation dialogs for delete. Soft delete with "Undo" toast. Auto-save drafts. |
| **Inconsistent terminology** | "Revenue" vs "RR" vs "ARR" used interchangeably, confusing | Use Skyvera's terms consistently. Tooltips explain abbreviations. Glossary link in header. |
| **Account health score without explanation** | Shows "73/100" but user doesn't know what factors contribute | Break down score: "73/100 = Revenue health (80) + Engagement (65) + AR status (75)". Click to see detail. |
| **Mobile-unfriendly interface** | Executive wants to check dashboard on phone, can't read anything | Responsive design or mobile-optimized view for top KPIs. (Defer to post-demo, desktop-first for 24hr). |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Account plans:** Often missing handling for customers with no Salesforce data - verify empty state UI and error handling
- [ ] **Financial calculations:** Often missing division-by-zero checks - verify all ratio/percentage calculations with edge cases (zero revenue, zero costs)
- [ ] **Scenario modeling:** Often missing validation that outputs are mathematically possible - verify bounds checking (no negative headcount, margins 0-100%)
- [ ] **Natural language query:** Often missing fallback when query can't be interpreted - verify "I don't understand" error state with examples
- [ ] **Data refresh:** Often missing indication when refresh fails - verify error state shows last successful refresh time and retry option
- [ ] **Excel parsing:** Often missing handling for unexpected sheet structure - verify error message when required sheets/columns missing
- [ ] **API integrations:** Often missing timeout and retry logic - verify 30-second timeout, one retry, then graceful failure with cached data
- [ ] **Loading states:** Often missing for API calls - verify every async operation has loading indicator
- [ ] **Error boundaries:** Often missing in React components - verify component errors don't crash entire app, show error UI instead
- [ ] **Form validation:** Often missing client-side validation - verify required fields, number ranges, date formats before submission
- [ ] **Null/undefined handling:** Often missing defensive checks - verify no "undefined" or "NaN" text visible in UI
- [ ] **Date formatting:** Often missing timezone handling - verify dates display in consistent timezone (Skyvera's local time)
- [ ] **Currency formatting:** Often missing consistent unit display - verify all financial numbers show units ($M, $K) clearly
- [ ] **Responsive breakpoints:** Often missing mobile/tablet layouts - verify critical flows work on laptop (minimum bar for demo)
- [ ] **Browser compatibility:** Often only tested in Chrome - verify works in Safari/Firefox (MacOS users likely use Safari)
- [ ] **Demo reset:** Often missing ability to reset to clean state - verify can clear cache, reload data, start fresh without code deploy
- [ ] **Performance with real data:** Often only tested with 10 sample customers - verify with all 140 customers, actual Excel file size
- [ ] **Accessibility basics:** Often missing keyboard navigation, screen reader support - verify tab navigation works for forms/buttons (minimum bar)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover during or after demo.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **AI generates wrong numbers** | LOW (if caught immediately) | Have Excel file open in another window as source of truth. Say "Let me verify that calculation" and show Excel. Demonstrates transparency. |
| **API rate limit hit** | MEDIUM | Switch to cached/sample data mode. Say "Let me show you with yesterday's data snapshot". Pre-load fallback data for this scenario. |
| **App crashes during demo** | HIGH | Have backup demo video ready. Browser refresh should restore state (use localStorage). Keep backup browser tab with app already loaded. |
| **Performance too slow** | MEDIUM | Use smaller dataset for demo (50 customers not 140). Pre-cache all data before demo starts. Disable real-time refresh during demo. |
| **Data inconsistency noticed** | MEDIUM | Acknowledge immediately: "Good catch - this highlights why data governance is critical. Let me show you the reconciliation dashboard." Turn bug into feature discussion. |
| **NL query misinterprets question** | LOW | Say "Let me ask that more specifically" and use pre-tested query. Shows product is powerful but users need to learn query patterns. |
| **Scenario produces unrealistic result** | MEDIUM | Say "That's an extreme scenario - let me adjust the assumptions to something more realistic". Shows flexibility of modeling, not limitation. |
| **Missing feature questioned** | LOW | "That's planned for Phase 2" with specific timeline. Focus on what DOES work. Demonstrate value of current capabilities. |
| **Integration fails during demo** | HIGH | Have pre-loaded static data as fallback. Say "Let me show you with our test environment". Never try to debug live during demo. |
| **Browser/connection issues** | HIGH | Have offline-capable version. Local data cache. Multiple devices ready (laptop + tablet backup). Test venue WiFi beforehand. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Unreliable AI outputs | Phase 1 (Foundation) | Test 10 prompts with production Excel data, verify financial numbers match source within 0.1% |
| API rate limits | Phase 2 (Data Integration) | Load test: fetch 140 customers + 6 months history without hitting Salesforce limit |
| Data quality issues | Phase 2 (Data Integration) | Run data validation suite, verify reconciliation dashboard shows all conflicts |
| Scenario unrealistic outputs | Phase 4 (Scenario Modeling) | Test 20 extreme scenarios, verify all outputs within business logic bounds |
| Prompt engineering failures | Phase 1 (Foundation) | Benchmark: 95% of prompts complete <10 seconds, consistent outputs for identical inputs |
| NL query misinterpretation | Phase 5 (NL Query) | User testing: 80% query success rate on first try with 10 common business questions |
| Missing edge case handling | Every Phase | Checklist review before phase completion, test with production data |
| Performance bottlenecks | Phase 2 & ongoing | Performance budget: <2s initial load, <500ms view transitions, <10s data refresh |
| Security vulnerabilities | Phase 1 (Foundation) | Audit: no API keys in frontend, all external calls through backend proxy |
| Poor UX feedback | Every Phase | User testing: can users understand what system is doing at all times? |

## Timeline-Specific Warnings

Special pitfalls when building under 24-hour constraint.

### Hour 0-6: Foundation Phase

**High Risk:**
- Trying to build perfect architecture instead of working prototype
- Over-engineering the data model before understanding real data structure
- Spending 3 hours on tool setup instead of coding

**Mitigation:**
- Use existing Dashboard HTML as starting point, don't start from scratch
- Parse actual Skyvera Excel file in first hour to understand real data structure
- Use create-react-app or Vite with TypeScript, don't configure custom build
- Pick familiar tech stack - not time to learn new framework

### Hour 6-12: Feature Building Phase

**High Risk:**
- Building features in isolation without testing integration
- Using sample data that doesn't match production data structure
- Skipping error handling "to add later"

**Mitigation:**
- Test with real 140 customer records starting Hour 6
- Build critical path first (view account plan, run scenario), defer nice-to-haves
- Add loading states and error handling as you build each feature, not as cleanup

### Hour 12-18: Integration Phase

**High Risk:**
- Integration surprises (API doesn't work as documented, data format mismatches)
- Cascading failures (one broken API breaks entire dashboard)
- Performance problems only discovered when connecting real data

**Mitigation:**
- Test real API calls early, have fallback/mock data ready
- Build circuit breakers: one failed integration doesn't crash app
- Monitor performance: if operation takes >5s, optimize immediately

### Hour 18-24: Demo Prep Phase

**High Risk:**
- Finding critical bugs with no time to fix
- Demo environment differs from dev (WiFi, browser, screen size)
- No fallback plan if something breaks

**Mitigation:**
- Feature freeze at Hour 18, only bug fixes after
- Test full demo flow 3x in Hour 20-22 on actual demo environment
- Have backup: demo video, pre-loaded data, offline mode
- Create demo script with fallback paths for each section

## Sources

**AI Integration in BI:**
- [Sigma Computing - AI/ML Pitfalls in BI](https://www.sigmacomputing.com/blog/ai-machine-learning-bi-solutions)
- [IBM - AI Integration Challenges 2026](https://www.ibm.com/think/insights/ai-integration)
- [RTInsights - Why AI-Driven BI Still Fails](https://www.rtinsights.com/turning-data-into-action-why-ai-driven-business-intelligence-still-fails-and-how-to-fix-it/)
- [SR Analytics - BI Trends 2026: Why 90% Fail With AI](https://sranalytics.io/blog/business-intelligence-trends/)

**Scenario Modeling:**
- [Workday - Scenario Modeling Framework](https://blog.workday.com/en-us/scenario-modeling-101-framework-strategic-financial-planning.html)
- [Cube Software - Scenario Planning 2026](https://www.cubesoftware.com/blog/scenario-planning)
- [Syntellis - Scenario Planning Guide](https://www.stratadecision.com/what-is-scenario-planning)
- [Datarails - Scenario Analysis Guide](https://www.datarails.com/scenario-analysis/)

**Real-Time Data Integration:**
- [LinkedIn - Real-Time BI Challenges](https://www.linkedin.com/pulse/real-time-bi-overcoming-challenges-data-integration-digazu)
- [AlphaBold - Power BI Integration Challenges 2026](https://www.alphabold.com/overcoming-power-bi-integration-challenges/)
- [IBM - Data Integration Challenges](https://www.ibm.com/think/insights/data-integration-challenges)
- [RevealBI - Data Integration Challenges](https://www.revealbi.io/blog/data-integration-challenges)

**Claude API & Prompt Engineering:**
- [Prompt Builder - Claude Best Practices 2026](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026)
- [Anthropic - Prompt Engineering Best Practices](https://claude.com/blog/best-practices-for-prompt-engineering)
- [Medium - Building Production Apps with Claude API](https://medium.com/@reliabledataengineering/building-production-apps-with-claude-api-the-complete-technical-guide-to-prompts-tokens-and-8a740b9bab3a)
- [GitHub - Claude Prompt Engineering Guide](https://github.com/ThamJiaHe/claude-prompt-engineering-guide)

**CRM Integration:**
- [Monday.com - Account Management Software 2026](https://monday.com/blog/crm-and-sales/account-management-software/)
- [BigContacts - CRM Accounting Software](https://www.bigcontacts.com/blog/best-crm-for-accountants/)
- [Shopify - CRM Integration Guide](https://www.shopify.com/blog/crm-integration)

**MVP Development:**
- [Intelegain - MVP Development Mistakes](https://www.intelegain.com/top-10-mvp-development-mistakes-startups-should-avoid/)
- [Low Code Agency - MVP Mistakes](https://www.lowcode.agency/blog/mvp-development-challenges-mistakes)
- [Vivasoft - MVP Development Challenges](https://vivasoftltd.com/mvp-development-challenges/)
- [Codebridge - MVP Development Mistakes](https://www.codebridge.tech/articles/avoid-these-10-mvp-development-mistakes-like-the-plague)

**Excel Integration:**
- [Integrate.io - Excel Import Errors](https://www.integrate.io/blog/excel-import-errors-heres-how-to-fix-them-fast/)
- [How-To Geek - Excel Problems 2026](https://www.howtogeek.com/microsoft-excel-problems-microsoft-should-finally-fix-in-2026/)
- [Spec India - Data Integration Challenges](https://www.spec-india.com/blog/data-integration-challenges-and-solutions)
- [Knack - Excel Data Management Risks](https://www.knack.com/blog/excel-data-management/)

**Natural Language Query:**
- [Holistics - AI-Powered BI Tools 2026](https://www.holistics.io/bi-tools/ai-powered/)
- [Yellowfin - Natural Language Query](https://www.yellowfinbi.com/blog/what-is-natural-language-query-nlq)
- [AI Growth Logic - Natural-Language BI](https://aigrowthlogic.com/ai-data-natural-language-bi/)
- [Symbolic Data - NL Querying Guide 2025](https://www.symbolicdata.org/natural-language-querying/)

**Salesforce Integration:**
- [Salesforce - API Limits Quick Reference](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_app_limits_cheatsheet.pdf)
- [Coefficient - Salesforce API Rate Limits](https://coefficient.io/salesforce-api/salesforce-api-rate-limits)
- [SalesforceCodex - Integration Challenges](https://salesforcecodex.com/salesforce/top-salesforce-integration-challenges-and-how-to-solve-them/)
- [StackSync - Bypass Salesforce API Limits](https://www.stacksync.com/blog/bypass-salesforce-api-limits-real-time-bi-directional-sync)

---
*Pitfalls research for: Skyvera Business Intelligence Platform (24-hour demo)*
*Researched: 2026-02-08*
