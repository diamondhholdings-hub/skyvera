---
phase: 01-foundation-and-data-integration
plan: 03
subsystem: intelligence
tags: [claude, anthropic, rate-limiting, caching, orchestration, prompts, ai]

# Dependency graph
requires:
  - phase: 01-foundation-and-data-integration
    provides: Result types for error handling and CacheManager from plan 01-02
provides:
  - ClaudeOrchestrator singleton for all Claude API communication
  - Rate limiter with token bucket (50 RPM) and even distribution
  - Priority queue (HIGH/MEDIUM/LOW) for user-facing vs background requests
  - Response caching with 5-15 min TTL based on priority
  - Four prompt templates (system, account-intel, scenario-impact, nl-query)
  - Exponential backoff with jitter on 429 errors
  - Request statistics tracking (hits, misses, latency)
affects: [01-04, account-intelligence, scenario-modeling, nl-query-handler, all-claude-features]

# Tech tracking
tech-stack:
  added:
    - rate-limiter-flexible (already in package.json from 01-01)
    - @anthropic-ai/sdk (already in package.json from 01-01)
  patterns:
    - Singleton pattern for ClaudeOrchestrator and CacheManager
    - Priority queue with simple sorted array (HIGH > MEDIUM > LOW)
    - Cache-aside pattern with TTL and jitter
    - Token bucket rate limiting with recursive retry
    - Hash-based cache keys (djb2 algorithm) for prompt deduplication
    - Exponential backoff with jitter on API errors
    - Structured JSON prompts with confidence levels and source citations

key-files:
  created:
    - src/lib/cache/manager.ts - In-memory cache with TTL, jitter, pattern invalidation, graceful degradation
    - src/lib/intelligence/claude/rate-limiter.ts - Token bucket rate limiter for Claude API (50 RPM)
    - src/lib/intelligence/claude/orchestrator.ts - Central Claude API gateway with priority queue, caching, retry logic
    - src/lib/intelligence/claude/prompts/system.ts - Base system prompt with metric definitions injection
    - src/lib/intelligence/claude/prompts/account-intel.ts - Customer intelligence analysis prompts
    - src/lib/intelligence/claude/prompts/scenario-impact.ts - What-if scenario modeling prompts
    - src/lib/intelligence/claude/prompts/nl-query.ts - Natural language query prompts
  modified: []

key-decisions:
  - "Cache manager created as blocking dependency (Plan 01-02 not fully tracked but files existed)"
  - "Used in-memory Map for cache storage (demo-appropriate, can swap to Redis post-demo)"
  - "50 RPM rate limit with even distribution via rate-limiter-flexible"
  - "Priority queue implemented as sorted array (simple, sufficient for demo scale)"
  - "Cache TTL varies by priority: HIGH=300s, MEDIUM/LOW=900s"
  - "djb2 hash algorithm for cache keys (fast, non-cryptographic, sufficient for deduplication)"
  - "Max 3 retries on 429 errors with exponential backoff (1-2s base, doubles each retry)"
  - "All prompts specify JSON output format for structured responses"
  - "Result type used throughout for explicit error handling (no throws)"

patterns-established:
  - "All Claude API requests MUST flow through ClaudeOrchestrator.processRequest()"
  - "Rate limiter prevents >50 RPM automatically with queueing"
  - "Cache keys include both prompt and system prompt for proper deduplication"
  - "Priority queue ensures user-facing requests (HIGH) process before background (LOW)"
  - "Prompt templates are pure functions returning strings"
  - "All prompts require confidence levels and source citations in responses"
  - "Graceful degradation: cache failures don't crash, just skip caching"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 1 Plan 03: Claude API Orchestration Summary

**Central Claude API orchestrator with rate limiting (50 RPM), priority queue, response caching (5-15 min TTL), and four prompt templates for account intelligence, scenario modeling, NL queries, and system context injection**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T04:10:32Z
- **Completed:** 2026-02-09T04:15:01Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Built ClaudeOrchestrator singleton that centralizes all Claude API communication with priority queue, rate limiting, and caching
- Implemented token bucket rate limiter (50 RPM) with even distribution to prevent 429 errors
- Created four prompt templates covering all use cases: system context, account intelligence, scenario impact, and natural language queries
- Established graceful error handling throughout (Result types, no unhandled exceptions)
- Added response caching with TTL based on priority (5 min for user queries, 15 min for background enrichment)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build rate limiter and Claude orchestrator with priority queue and caching** - `be0d854` (feat)
2. **Task 2: Create prompt templates for all Claude use cases** - `6de8569` (feat)

## Files Created/Modified

**Intelligence Layer:**
- `src/lib/cache/manager.ts` - In-memory cache with TTL, jitter (±10%), pattern invalidation, metadata retrieval, graceful degradation
- `src/lib/intelligence/claude/rate-limiter.ts` - Token bucket rate limiter (50 requests/60 seconds, even distribution)
- `src/lib/intelligence/claude/orchestrator.ts` - Central Claude API gateway with priority queue (HIGH/MEDIUM/LOW), response caching, exponential backoff on 429, request stats tracking

**Prompt Templates:**
- `src/lib/intelligence/claude/prompts/system.ts` - Base system prompt builder with metric definitions injection
- `src/lib/intelligence/claude/prompts/account-intel.ts` - Customer intelligence prompts (risk assessment, growth opportunities, recommended actions)
- `src/lib/intelligence/claude/prompts/scenario-impact.ts` - What-if scenario analysis prompts (impact summary, affected metrics, risk assessment, recommendations)
- `src/lib/intelligence/claude/prompts/nl-query.ts` - Natural language query prompts (interpretation, clarification handling, multi-turn conversation support)

## Decisions Made

**Cache Manager as Blocking Dependency:**
- Plan 01-03 depends on 01-01, but CacheManager is from 01-02
- Found semantic layer files already existed (01-02 was executed but not tracked in my session)
- Created cache manager as part of Task 1 to unblock orchestrator (Deviation Rule 3: Auto-fix blocking issues)
- Verified cache manager implementation matches 01-02 plan specifications

**Rate Limiting Strategy:**
- Used rate-limiter-flexible library with RateLimiterMemory for demo (single instance)
- Configured for Claude API Tier 1 limits: 50 requests per 60 seconds
- execEvenly: true distributes requests evenly across the window (prevents bursts)
- Recursive retry with safety counter (max 5) to prevent infinite loops

**Priority Queue Implementation:**
- Used simple sorted array instead of full priority queue library
- Sufficient for demo scale, easier to debug, no external dependencies
- Sorts on enqueue: HIGH (0) < MEDIUM (1) < LOW (2)

**Cache TTL Strategy:**
- HIGH priority (user waiting): 300s (5 min) - fresher data for interactive queries
- MEDIUM/LOW priority (background): 900s (15 min) - longer cache for enrichment tasks
- Jitter (±10%) prevents thundering herd on cache expiry

**Error Handling Approach:**
- All functions return Result<T, Error> (no throwing exceptions)
- Missing API key returns descriptive error, doesn't crash app
- Cache failures gracefully degrade (log warning, return fetched data)
- 429 errors trigger exponential backoff (1-2s base, doubles, max 3 retries)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created CacheManager before orchestrator**
- **Found during:** Task 1 (ClaudeOrchestrator instantiation)
- **Issue:** Plan 01-03 depends on 01-01 but CacheManager is from 01-02. Files existed but cache manager wasn't available in my session context.
- **Fix:** Created cache manager implementation based on 01-02 plan specifications before building orchestrator
- **Files modified:** src/lib/cache/manager.ts (created)
- **Verification:** Cache manager tests pass (TTL, jitter, pattern invalidation, graceful degradation)
- **Committed in:** be0d854 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Result type error handling in orchestrator**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** err() helper expects Error type, but orchestrator was passing strings
- **Fix:** Wrapped all error strings in new Error() constructor
- **Files modified:** src/lib/intelligence/claude/orchestrator.ts
- **Verification:** TypeScript compilation passes with zero errors
- **Committed in:** be0d854 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed Zod error property in validator**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** Semantic validator using result.error.errors instead of result.error.issues (Zod v4 API change)
- **Fix:** Changed to result.error.issues[0] and added type annotation (err: z.ZodIssue)
- **Files modified:** src/lib/semantic/validator.ts (from 01-02)
- **Verification:** TypeScript compilation passes
- **Committed in:** Auto-fixed by linter before Task 1 commit

---

**Total deviations:** 3 auto-fixed (1 blocking dependency, 2 bugs)
**Impact on plan:** All auto-fixes necessary for compilation and correct operation. No scope creep. Cache manager creation was essential blocker resolution.

## Issues Encountered

**Plan Dependency Gap:**
- Plan 01-03 frontmatter says `depends_on: ["01-01"]` but requires CacheManager from 01-02
- Git history shows 01-02 commits exist (648244b, a2f42d2) but weren't visible in my session
- Resolution: Created cache manager as blocking dependency fix (Rule 3)
- Recommendation: Update plan frontmatter to `depends_on: ["01-01", "01-02"]` for accuracy

**Zod API Changes:**
- Semantic validator from 01-02 used old Zod API (.errors instead of .issues)
- Resolution: Fixed property access to match Zod v4 API
- No impact on plan execution

All issues resolved without impacting plan scope or objectives.

## User Setup Required

**Anthropic API Key (for Claude orchestration):**

Before using any Claude intelligence features:

1. Get API key from: https://console.anthropic.com/settings/keys
2. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

**Verification:**
```bash
# Orchestrator will log warning if key is missing
npm run dev
# Check console for "ANTHROPIC_API_KEY not configured" warning
```

**Note:** Orchestrator handles missing key gracefully (returns Result.err, no crash). Safe to develop without key, but Claude features will return errors.

## Next Phase Readiness

**Ready:**
- ClaudeOrchestrator singleton available via getOrchestrator()
- All features can call processRequest() or processRequestWithSemanticContext()
- Rate limiting prevents 429 errors automatically (50 RPM with queueing)
- Response caching reduces API costs and improves latency
- Four prompt templates ready for account intel, scenario modeling, NL queries
- Request statistics available via getStats() for monitoring

**Integration Points:**
- Account intelligence (Plan 01-04): Use buildAccountIntelPrompt() + processRequest()
- Scenario modeling: Use buildScenarioPrompt() + processRequest()
- NL query handler: Use buildNLQueryPrompt() + processRequestWithSemanticContext()
- All features: Import getOrchestrator() singleton, no direct Anthropic SDK calls

**Next Steps:**
- Plan 01-04: Data adapters can now call orchestrator for Claude-powered enrichment
- Phase 2: UI components can use orchestrator for real-time intelligence queries
- Phase 3: Intelligence features (account cards, scenario modeler) ready to integrate

**No Blockers:**
- TypeScript compilation passes with zero errors
- All orchestrator tests pass (rate limiting, caching, error handling)
- Prompt templates verified with structured output
- Cache manager fully functional with graceful degradation

---
*Phase: 01-foundation-and-data-integration*
*Plan: 03*
*Completed: 2026-02-09*
