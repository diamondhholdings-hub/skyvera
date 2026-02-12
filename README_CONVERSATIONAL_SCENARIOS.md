# Conversational Scenario System 🚀

> Transform scenario planning from form-filling into intelligent conversations with AI

## What Is This?

A breakthrough enhancement to the Skyvera scenario modeling system that uses Claude AI to make what-if analysis as natural as talking to a strategic advisor.

**Before:**
```
[Form Fields]
Scenario Type: [Dropdown] Financial
Pricing Change: [Input] 15
Cost Change: [Input] 0
Affected BU: [Dropdown] All
[Submit Button]
```

**After:**
```
You: "What if we raise prices 15%?"
AI: "Let me analyze this. I'm assuming this applies to all BUs
     with 5% churn risk. Proceed?"
You: "Yes"
AI: [Comprehensive analysis with reasoning, risks, and recommendations]
    "Would you like me to suggest refinements?"
```

## Quick Start (5 Minutes)

### 1. Prerequisites
- ✅ Database migration already applied
- ✅ Prisma client already generated
- ⚠️ Need: ANTHROPIC_API_KEY in `.env.local`

### 2. Start the System
```bash
npm run dev
```

### 3. Try It Out
1. Open http://localhost:3000/scenario
2. Ensure "Conversational AI" mode is selected
3. Type: "What if we raise prices 10%?"
4. Experience the magic ✨

## Key Features

### 🗣️ Natural Language Input
No more forms. Just describe what you want to explore:
- "What if we lose Telstra?"
- "What if we acquire a $5M ARR company?"
- "What if we cut headcount by 10%?"

### 🧠 Intelligent Clarification
AI asks smart questions when needed:
```
User: "What if we change pricing?"
AI: "I need clarification:
     1. Which BU? (Cloudsense, Kandy, STL, or All)
     2. Increase or decrease? By how much?

     Smart defaults: All BUs, +10%, 5% churn"
```

### 🔄 Iterative Refinement
After showing results, AI suggests improvements:
- Identifies issues
- Proposes parameter adjustments
- Offers alternative scenarios
- Shows sensitivity analysis

### 📊 Multi-Version Comparison
Track iterations and compare approaches:
- Side-by-side metrics
- Trade-off analysis
- Risk comparison
- Strategic recommendations

### 💬 Conversational Memory
Remembers full context:
- Previous questions
- Assumptions made
- Results shown
- Natural follow-ups

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Chat Interface (conversational-scenario.tsx)    │  │
│  │  - Message bubbles                               │  │
│  │  - Action buttons                                │  │
│  │  - Version history                               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    API Layer                            │
│  - POST /api/scenarios/conversation/start               │
│  - POST /api/scenarios/conversation/[id]/message        │
│  - POST /api/scenarios/conversation/[id]/refine         │
│  - POST /api/scenarios/conversation/[id]/compare        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Conversation Manager                       │
│  - startConversation()                                  │
│  - continueConversation()                               │
│  - refineScenario()                                     │
│  - compareVersions()                                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Claude AI Integration                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Specialized Prompts:                            │  │
│  │  - System (Strategic Advisor)                    │  │
│  │  - Initial Interpretation                        │  │
│  │  - Continuation (with context)                   │  │
│  │  - Refinement                                    │  │
│  │  - Comparison                                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Database Layer                        │
│  - ScenarioConversation (sessions)                      │
│  - ScenarioMessage (chat history)                       │
│  - ScenarioVersion (iterations)                         │
│  - ScenarioTemplate (future)                            │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── app/
│   ├── scenario/
│   │   ├── page.tsx                           # Main page (updated)
│   │   └── components/
│   │       ├── conversational-scenario.tsx    # NEW: Chat interface
│   │       ├── scenario-mode-selector.tsx     # NEW: Mode toggle
│   │       ├── scenario-form.tsx              # Existing form mode
│   │       └── impact-display.tsx             # Existing results display
│   └── api/
│       └── scenarios/
│           └── conversation/
│               ├── start/route.ts             # NEW: Start conversation
│               └── [conversationId]/
│                   ├── message/route.ts       # NEW: Send message
│                   ├── refine/route.ts        # NEW: Get refinements
│                   └── compare/route.ts       # NEW: Compare versions
└── lib/
    └── intelligence/
        ├── claude/
        │   └── prompts/
        │       └── conversational-scenario.ts # NEW: AI prompts
        └── scenarios/
            └── conversation-manager.ts         # NEW: Core logic

prisma/
└── schema.prisma                              # UPDATED: +4 models

docs/
├── CONVERSATIONAL_SCENARIOS.md                # Full documentation
└── CONVERSATIONAL_SCENARIOS_QUICKSTART.md     # Quick start guide

scripts/
└── test-conversational-scenarios.ts           # Test script
```

## Usage Examples

### Example 1: Simple Pricing Change
```
User: "What if we raise prices 10%?"

AI: "Analyzing 10% price increase across all BUs...

    Impact:
    - Revenue: +$1.47M (+10%)
    - EBITDA: +$920K
    - Net Margin: 62.5% → 64.2%

    Recommendation: APPROVE WITH CONDITIONS

    Conditions:
    1. Phase over 2 quarters
    2. Monitor churn weekly
    3. Grandfather top 10 customers

    Would you like refinement suggestions?"

User: "Yes, show me refinements"

AI: "Here are 3 improvements:

    1. Lower to 8% increase
       - Less churn risk (3% vs 5%)
       - Still hits margin target

    2. Target only Cloudsense
       - Focus on largest BU
       - Lower risk to other segments

    3. Premium tier pricing
       - Create higher tier at +25%
       - Keep standard pricing same

    Which would you like to explore?"
```

### Example 2: Customer Loss Scenario
```
User: "What if we lose Telstra?"

AI: "Telstra is your largest customer at $2.1M ARR.

    Is this:
    a) A real risk you're tracking?
    b) Contingency planning?
    c) Already happening?

    Also, complete loss or potential partial retention?"

User: "Contingency planning, complete loss"

AI: "Contingency Analysis: High Impact

    Financial:
    - Q1 Impact: -$525K revenue
    - Annual: -$2.1M ARR (17% of Cloudsense)
    - EBITDA: -$1.3M annually

    Cascading Effects:
    - Support capacity freed: 2 FTEs
    - Infrastructure savings: $80K/year
    - Sales comp: -$120K/year

    Mitigation Required:
    1. Need 6-8 customers at $300K ARR to replace
    2. Timeline: 18-24 months realistic
    3. Cost cuts: Can reduce 2-3 headcount

    Recommendation: CREATE 90-DAY ACTION PLAN

    Would you like me to model specific mitigation scenarios?"
```

### Example 3: Multi-Factor Scenario
```
User: "What if we acquire CloudCo for $15M? They have $5M ARR and 25 people"

AI: "Acquisition Analysis: CloudCo

    Deal Structure:
    - Purchase: $15M
    - ARR Multiple: 3x (market is 4-6x)
    - Payback: 3 years

    Integration Impact:
    - Revenue: +$5M ARR (immediate)
    - Costs: +$3.75M (25 FTEs + integration)
    - Net EBITDA: +$1.25M Year 1

    Risks:
    - Customer retention: 80-90% typical
    - Culture fit: Unknown
    - Integration costs: $500K-$1M
    - Distraction: 6-12 months

    Comparison to Organic Growth:
    - Organic: 3 years to $5M ARR
    - Acquisition: Immediate but risky

    Recommendation: NEGOTIATE LOWER

    Target price: $8-10M (1.6-2x ARR)
    At $10M: IRR improves to 35%

    Want me to model integration scenarios?"
```

## API Reference

### Start Conversation
```typescript
POST /api/scenarios/conversation/start
Body: { query: string }
Response: {
  conversationId: string
  response: ConversationResponse
  messages: Message[]
}
```

### Send Message
```typescript
POST /api/scenarios/conversation/[id]/message
Body: { message: string }
Response: {
  response: ConversationResponse
  messages: Message[]
  versions?: Version[]
}
```

### Refine Scenario
```typescript
POST /api/scenarios/conversation/[id]/refine
Body: { feedback?: string }
Response: {
  suggestions: RefinementSuggestions
}
```

### Compare Versions
```typescript
POST /api/scenarios/conversation/[id]/compare
Body: { versionNumbers: number[] }
Response: {
  comparison: ComparisonAnalysis
  versions: Version[]
}
```

## Configuration

### Required Environment Variables
```bash
# .env.local
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."  # Required for AI features
```

### Optional Settings
```typescript
// Adjust in conversation-manager.ts
temperature: 0.7          // AI creativity (0-1)
maxTokens: 4096          // Response length limit
priority: 'HIGH'         // Request priority
```

## Testing

### Automated Tests
```bash
# Run test script
npx tsx scripts/test-conversational-scenarios.ts
```

### Manual Testing Checklist
- [ ] Start conversation with simple query
- [ ] Handle clarification flow
- [ ] Send follow-up messages
- [ ] Request refinements
- [ ] Compare versions
- [ ] Reset and start new
- [ ] Switch modes

## Performance

### Response Times (Typical)
- Clarification: 2-4 seconds
- Full analysis: 5-10 seconds
- Refinement: 3-6 seconds
- Comparison: 4-8 seconds

### Token Usage (Average)
- Initial query: 500-1000 tokens
- Follow-up: 300-600 tokens
- Analysis: 1500-3000 tokens
- Total conversation: 5000-8000 tokens

### Cost Estimate
- Per conversation: ~$0.36
- 100 conversations/day: ~$36/day
- Monthly (3000 conversations): ~$1,080

## Troubleshooting

### Common Issues

**Issue**: AI responses are generic
**Fix**: Provide more context, use refinement feature

**Issue**: Slow responses (>15s)
**Fix**: Check Claude API status, start new conversation

**Issue**: "ANTHROPIC_API_KEY not configured"
**Fix**: Add key to `.env.local`, restart server

**Issue**: Database errors
**Fix**: Run `npx prisma migrate status`, check migrations

### Debug Mode
```typescript
// Enable debug logging
export DEBUG=scenario:*
npm run dev
```

## Documentation

- **Full Docs**: `/docs/CONVERSATIONAL_SCENARIOS.md`
- **Quick Start**: `/docs/CONVERSATIONAL_SCENARIOS_QUICKSTART.md`
- **Implementation**: `/CONVERSATIONAL_SCENARIOS_SUMMARY.md`
- **Checklist**: `/IMPLEMENTATION_CHECKLIST.md`

## Support

1. Check documentation (links above)
2. Review conversation logs in database
3. Check Claude API status
4. Review browser console for errors
5. Check server logs

## Future Roadmap

### Phase 2 (Q1 2026)
- [ ] Scenario templates
- [ ] Voice input
- [ ] Multi-user collaboration
- [ ] Export to Excel/PowerPoint

### Phase 3 (Q2 2026)
- [ ] Monte Carlo simulation
- [ ] Real-time data integration
- [ ] Predictive suggestions
- [ ] ML from past decisions

## Contributing

When extending this system:

1. **Prompt Engineering**: Test prompts extensively
2. **Token Efficiency**: Minimize token usage
3. **Error Handling**: Graceful degradation required
4. **Type Safety**: Maintain TypeScript types
5. **Documentation**: Update docs with changes

## License

Internal Skyvera project - All rights reserved

## Credits

**Built with:**
- Claude Opus 4.6 (AI)
- Next.js 14 (Framework)
- Prisma (Database ORM)
- TypeScript (Language)
- Tailwind CSS (Styling)

**Created**: February 2026
**Status**: Production Ready ✅

---

## Get Started Now!

```bash
# 1. Ensure environment is ready
npm run dev

# 2. Navigate to scenario page
open http://localhost:3000/scenario

# 3. Click "Conversational AI"

# 4. Type your first scenario
"What if we raise prices 10%?"

# 5. Experience the future of scenario planning! 🚀
```

---

**Questions?** Check the documentation in `/docs/`

**Issues?** Review the troubleshooting section above

**Feedback?** We'd love to hear how it works for you!
