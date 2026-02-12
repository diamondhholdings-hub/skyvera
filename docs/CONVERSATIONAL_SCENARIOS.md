# Conversational Scenario System

## Overview

The Conversational Scenario System transforms scenario modeling from a traditional form-filling exercise into an intelligent, iterative conversation with an AI strategic advisor. This system uses Claude AI to help executives explore what-if scenarios through natural language, ask clarifying questions, and provide context-aware recommendations.

## Key Features

### 1. Natural Language Input
Instead of:
```
Form Field: Pricing Change (%)
Input: 15
```

Users can simply say:
```
"What if we raise prices 15%?"
"What if we lose our top 3 customers?"
"What if we acquire a company with $5M ARR?"
```

### 2. Intelligent Clarification
When scenarios are ambiguous, the AI asks focused questions:

**User:** "What if we change pricing?"

**AI:** "I need some clarification:
1. Which business unit? (Cloudsense, Kandy, STL, or All)
2. Increase or decrease? By what percentage?
3. Do we expect any customer churn from this change?

**Smart defaults based on your data:**
- Business Unit: Cloudsense (largest BU)
- Pricing Change: +10% (common industry practice)
- Churn Risk: 5% (industry average)

You can accept these defaults or specify different values."

### 3. Iterative Refinement
After showing results, the AI suggests improvements:

```json
{
  "currentIssues": [
    "High churn risk with 15% price increase",
    "Net margin below target by 2%"
  ],
  "suggestions": [
    {
      "parameter": "pricingChange",
      "currentValue": 15,
      "suggestedValue": 10,
      "reasoning": "Lower increase reduces churn risk from 15% to 8% while still improving margin by $400K",
      "expectedImpact": "EBITDA +$500K (vs +$750K) but 7% less churn"
    }
  ],
  "alternativeScenarios": [
    {
      "name": "Phased approach",
      "description": "5% increase in Q1, evaluate customer response, then 5% more in Q3",
      "expectedOutcome": "Lower risk, built-in feedback loop, similar total revenue impact"
    }
  ]
}
```

### 4. Multi-Version Comparison
Track and compare different scenario versions:

```
Version 1: Conservative (10% price increase, 5% churn)
- Revenue: +$1.2M
- EBITDA: +$750K
- Risk: Low

Version 2: Aggressive (15% price increase, 12% churn)
- Revenue: +$1.8M
- EBITDA: +$950K
- Risk: High

Recommendation: Version 1 is preferred
Reasoning: More sustainable approach with manageable churn risk. Version 2's higher reward doesn't justify 2.4x higher churn risk.
```

### 5. Conversational Memory
The system remembers the entire conversation context:
- Previous questions asked
- Assumptions made
- Parameters discussed
- Results shown

This allows for natural follow-up questions like:
- "What if we make that churn risk lower?"
- "Show me what happens if we only apply this to Cloudsense"
- "Compare this to the version we looked at earlier"

## Architecture

### Database Models

#### ScenarioConversation
Tracks the overall conversation session:
```typescript
{
  conversationId: string      // Unique identifier
  title: string              // Auto-generated from first message
  status: 'active' | 'completed' | 'archived'
  currentScenario: JSON      // Current scenario parameters
  scenarioType: string       // financial/headcount/customer/custom
  messageCount: number       // Total messages exchanged
  iterationCount: number     // Number of scenario versions created
  createdAt: DateTime
  lastMessageAt: DateTime
}
```

#### ScenarioMessage
Individual messages in the conversation:
```typescript
{
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string           // Message text
  messageType: string       // query/clarification/refinement/analysis/confirmation
  tokensUsed: number       // For cost tracking
  confidence: string       // HIGH/MEDIUM/LOW
  createdAt: DateTime
}
```

#### ScenarioVersion
Tracks scenario iterations:
```typescript
{
  conversationId: string
  versionNumber: number     // 1, 2, 3...
  scenarioData: JSON       // Complete scenario parameters
  calculatedMetrics: JSON  // Financial impact calculations
  claudeAnalysis: JSON     // AI analysis and recommendations
  impactSummary: string    // One-line summary
  label: string            // "Initial", "After refinement", etc.
  createdAt: DateTime
}
```

### API Endpoints

#### Start Conversation
```
POST /api/scenarios/conversation/start
Body: { query: string }
Returns: { conversationId, response, messages }
```

#### Send Message
```
POST /api/scenarios/conversation/[conversationId]/message
Body: { message: string }
Returns: { response, messages, versions }
```

#### Refine Scenario
```
POST /api/scenarios/conversation/[conversationId]/refine
Body: { feedback?: string }
Returns: { suggestions }
```

#### Compare Versions
```
POST /api/scenarios/conversation/[conversationId]/compare
Body: { versionNumbers: number[] }
Returns: { comparison, versions }
```

### Conversation Manager

The `ScenarioConversationManager` orchestrates the AI conversation:

```typescript
class ScenarioConversationManager {
  // Start new conversation
  async startConversation(userQuery: string, baseline: BaselineMetrics)

  // Continue existing conversation
  async continueConversation(state: ConversationState, userMessage: string, baseline: BaselineMetrics)

  // Get refinement suggestions
  async refineScenario(currentScenario: any, currentResults: any, userFeedback?: string)

  // Compare multiple versions
  async compareVersions(versions: ScenarioVersionData[])
}
```

### Prompt System

The system uses multiple specialized prompts:

1. **System Prompt**: Defines the AI's role as a strategic advisor
2. **Initial Scenario Prompt**: Interprets first user query
3. **Continuation Prompt**: Handles follow-up messages with full context
4. **Refinement Prompt**: Suggests improvements to scenarios
5. **Comparison Prompt**: Analyzes differences between versions

## Usage Examples

### Example 1: Simple Pricing Change

**User:** "What if we raise prices 10%?"

**AI:** "I'll analyze a 10% price increase across all business units. To provide accurate analysis, I'm assuming:
- Applies to all BUs (Cloudsense, Kandy, STL)
- 5% customer churn risk (industry average for this magnitude of increase)
- No change in costs

Shall I proceed with these assumptions, or would you like to adjust them?"

**User:** "Yes, proceed"

**AI:** *[Runs analysis and shows results]*

"Here's the impact:
- Revenue: +$1.47M (+10%)
- EBITDA: +$920K (+10%)
- Net Margin: 62.5% → 64.2%
- Risk: Moderate

**Recommendation:** APPROVE WITH CONDITIONS

This pricing increase improves profitability while staying within industry norms. However, I recommend:
1. Implement for new customers first
2. Grandfather existing customers with 90-day notice
3. Monitor churn closely for first quarter

Would you like to explore alternatives or refine this scenario?"

### Example 2: Complex Multi-Factor Scenario

**User:** "What if we lose Telstra and Optus?"

**AI:** "These are two of your largest customers. Let me clarify:

1. Are these accounts at risk currently, or is this a contingency planning exercise?
2. Would you lose them completely, or might there be partial retention?
3. What timeframe - immediate or over several quarters?

**Context:** Based on your data:
- Telstra: $2.1M ARR (Cloudsense)
- Optus: $1.8M ARR (Cloudsense)
- Combined: $3.9M ARR (31% of Cloudsense revenue)

This would be a significant impact. I can help you model:
- Revenue loss scenario
- Cost reduction actions needed
- Alternative customer acquisition targets"

**User:** "Complete loss over Q2"

**AI:** *[Runs detailed analysis including cascading effects]*

"Impact Analysis: High Severity

**Financial Impact:**
- Q2 Revenue: -$975K (quarterly from $3.9M ARR)
- Annual Impact: -$3.9M ARR
- EBITDA: -$610K (assuming 62.5% margin)
- Net Margin: 62.5% → 58.3%

**Cascading Effects:**
1. Support team capacity: Could reduce by 3 FTEs (~$450K annual savings)
2. Infrastructure costs: Reduce by ~$120K/year
3. Sales compensation: Lower due to lost renewals

**Mitigation Strategies:**
1. Immediate: Focus sales on 10 mid-size accounts ($200-400K ARR each)
2. Cost actions: Reduce headcount by 3-4 in customer success
3. Timeline: Need 18-24 months to fully replace this ARR

**Risk Assessment:**
- Severity: HIGH
- Likelihood: (You would know better - is this a real risk?)
- Mitigation Difficulty: HIGH (large accounts hard to replace)

**Recommendation:** CONDITIONAL PLANNING

Create a 90-day action plan for this scenario but prioritize retention efforts. Would you like me to model specific mitigation scenarios?"

### Example 3: Iterative Refinement

**User:** "What if we cut headcount by 15 people?"

**AI:** *[Shows analysis]*
"This would save $2.25M annually but risks:
- Customer satisfaction decline
- Slower product development
- Increased burnout in remaining team

Current net margin: 62.5%
After cuts: 68.1% (meets your 68.7% target)

However, I recommend a more strategic approach..."

**User:** "Show me alternatives"

**AI:** "Here are 3 alternative scenarios:

**Alternative 1: Targeted Reduction (10 people)**
- Focus on non-customer-facing roles
- Annual savings: $1.5M
- Lower risk to customer satisfaction
- Margin: 65.8%

**Alternative 2: Hiring Freeze + Attrition (8 people over 6 months)**
- Natural attrition with no backfills
- Savings: $1.2M annual (prorated)
- Minimal team disruption
- Margin: 64.9%

**Alternative 3: Hybrid (5 cuts + 5 contractors to FTE)**
- Replace expensive contractors with FTEs
- Net cost reduction: $750K
- Improve team stability
- Margin: 63.7%

Which would you like to explore further?"

## User Interface

### Conversational Mode
- **Chat Interface**: Natural conversation flow with message bubbles
- **Example Prompts**: Clickable suggestions to get started
- **Action Buttons**: "Refine Scenario", "Compare Versions", "New Scenario"
- **Version History**: List of all iterations with summaries
- **Real-time Analysis**: Results appear as new messages

### Traditional Form Mode
- Still available for users who prefer structured input
- Can switch between modes at any time

### Mode Toggle
Users can switch between conversational and form-based interfaces:
```
[Conversational AI] [Traditional Form]
```

## Best Practices

### For Users

1. **Start with Natural Language**
   - Don't worry about exact syntax
   - Describe what you want to understand
   - The AI will ask for specifics

2. **Iterate Freely**
   - Try different variations
   - Ask "what if" follow-ups
   - Compare multiple approaches

3. **Leverage AI Suggestions**
   - Review refinement suggestions
   - Consider alternative scenarios
   - Use smart defaults when uncertain

4. **Save Important Versions**
   - Label meaningful iterations
   - Compare different approaches
   - Track your decision-making process

### For Developers

1. **Prompt Engineering**
   - Keep system prompt focused on strategic advisor role
   - Use structured JSON responses for consistent parsing
   - Include confidence levels and reasoning

2. **Context Management**
   - Load full conversation history for continuity
   - Track scenario evolution across versions
   - Clean up old conversations periodically

3. **Error Handling**
   - Graceful degradation when Claude API unavailable
   - Validate AI responses before using
   - Provide fallback to form-based mode

4. **Performance**
   - Cache baseline metrics
   - Use rate limiting for Claude API
   - Minimize token usage with focused prompts

## Setup Instructions

### 1. Database Migration
```bash
npx prisma migrate dev --name add_conversational_scenarios
npx prisma generate
```

### 2. Environment Variables
Ensure `ANTHROPIC_API_KEY` is set in `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Test the System
1. Navigate to `/scenario`
2. Click "Conversational AI" mode
3. Try: "What if we raise prices 10%?"
4. Observe the conversation flow

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"
- Add your Anthropic API key to `.env.local`
- Restart the development server

### "Conversation not found"
- The conversation may have been archived
- Start a new conversation

### Messages not appearing
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure database migrations ran successfully

### AI responses seem generic
- System learns from your data over time
- Provide more context in your questions
- Use the refinement feature to guide the AI

## Future Enhancements

1. **Scenario Templates**
   - Pre-built scenarios for common questions
   - Industry benchmarks for comparison
   - Best practice recommendations

2. **Multi-User Collaboration**
   - Share conversations with team
   - Comment on scenarios
   - Approval workflows

3. **Advanced Analytics**
   - Sensitivity analysis visualization
   - Monte Carlo simulation
   - Historical scenario performance tracking

4. **Voice Input**
   - Speak scenarios instead of typing
   - More natural executive interaction

5. **Integration with Other Tools**
   - Export to Excel/PowerPoint
   - Integrate with budgeting tools
   - Connect to real-time financial data

## Technical Details

### Token Usage
Average token usage per conversation:
- Initial query: 500-1000 tokens
- Clarification: 300-600 tokens
- Analysis: 1500-3000 tokens
- Refinement: 800-1500 tokens

### Response Times
- Clarification questions: 2-4 seconds
- Full analysis: 5-10 seconds
- Refinement suggestions: 3-6 seconds
- Version comparison: 4-8 seconds

### Caching Strategy
- Baseline metrics: 15 minutes TTL
- Claude responses: 5 minutes TTL (for identical queries)
- Conversation state: No cache (always fresh)

## Support

For questions or issues:
1. Check this documentation
2. Review conversation logs in database
3. Check Claude API status
4. Contact development team

## Conclusion

The Conversational Scenario System transforms scenario planning from a technical exercise into a strategic conversation. By leveraging Claude AI's natural language understanding and reasoning capabilities, executives can explore complex scenarios more intuitively, receive intelligent guidance, and make better-informed decisions.

The system feels less like filling out forms and more like consulting with an experienced financial advisor who understands your business context and can think through implications with you.
