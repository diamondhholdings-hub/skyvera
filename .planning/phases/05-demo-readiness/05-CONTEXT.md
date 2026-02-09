# Phase 5: Demo Readiness - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden and prepare the complete Skyvera BI platform for executive demonstration. Ensure reliability, performance, and polish across all features built in Phases 1-4. Validate system handles real-world conditions (API failures, missing data, high load) without critical failures during demo walkthrough.

</domain>

<decisions>
## Implementation Decisions

### Testing Strategy
- **Both end-to-end demo flow AND feature smoke tests required**
- Automated Playwright tests for reproducibility and consistency
- Demo flow must pass 3x without critical failures before sign-off
- **Fix immediately on failure** - no triage, no workarounds during validation runs
- Test with **real API calls** (Claude API, NewsAPI) to validate rate limiting and error handling under production conditions

### Error Resilience
- **Claude API failures**: Fall back to cached responses (serve previously successful Claude responses - demo continues with slightly stale data)
- **Missing customer data**: Show empty states with clear "No data available" messages
- **Error messages**: Business-friendly language for executive audience ("Data temporarily unavailable" not "API timeout error")
- **NewsAPI failures**: Use OSINT search as backup (web scraping or alternative news sources if NewsAPI unavailable)

### Performance Tuning
- **Focus areas**: Dashboard (home) and Account plan pages get aggressive optimization
- **Dashboard target (<2s load)**: Aggressive caching - cache all dashboard data for 5 minutes (fast load prioritized over absolute freshness)
- **Account plan optimization**: Claude's discretion on approach (pre-compute on demand, background pre-warming, or lazy tab loading)
- **Performance measurement**: Claude's discretion on whether explicit instrumentation is worth the time investment

### Demo Data Quality
- **Intelligence coverage**: All 140 customer accounts need full intelligence data (news, insights, competitive analysis)
- **Financial metrics**: Real Skyvera data from Excel budget file (actual ARR, NRR, margin values for all accounts)
- **Claude insights strategy**: Pre-compute for hero accounts (British Telecom, Liquid Telecom, Telefonica UK, Spotify, AT&T), generate live with cache for others
- **News data**: Last 30 days for all 140 accounts (demonstrates freshness and comprehensive coverage)

### Claude's Discretion
- Specific Playwright test architecture and organization
- Account plan page optimization technique (pre-compute vs pre-warm vs lazy load)
- Whether to add explicit performance instrumentation or rely on DevTools
- OSINT search implementation details when NewsAPI unavailable
- Exact cache warming strategy and timing

</decisions>

<specifics>
## Specific Ideas

- "Fix immediately" philosophy: Demo must be flawless - no known issues during validation runs
- Full data coverage: All 140 accounts must handle exploration without gaps (not just hero accounts)
- Real data throughout: Use actual Skyvera financial data, not synthetic/mocked values
- Hybrid Claude strategy: Pre-computed insights for scripted walkthrough, live generation for ad-hoc exploration

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 05-demo-readiness*
*Context gathered: 2026-02-09*
