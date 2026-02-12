/**
 * Conversational scenario analysis prompt builder
 * Creates an intelligent, clarifying conversation about what-if scenarios
 */

export interface ConversationContext {
  conversationId: string
  previousMessages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  currentScenario?: {
    type?: string
    description?: string
    parameters?: Record<string, number>
    ambiguities?: string[]
  }
  baselineData: Record<string, number>
  iterationCount: number
}

export interface ClarificationResponse {
  needsClarification: boolean
  questions: string[]
  suggestedDefaults?: Record<string, number>
  readyToAnalyze: boolean
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ScenarioRefinementSuggestion {
  currentIssues: string[]
  suggestions: Array<{
    parameter: string
    currentValue: number
    suggestedValue: number
    reasoning: string
  }>
  alternativeScenarios: Array<{
    name: string
    description: string
    expectedOutcome: string
  }>
}

/**
 * Build system prompt for conversational scenario advisor
 */
export function buildConversationalScenarioSystemPrompt(): string {
  return `You are a strategic financial advisor specializing in what-if scenario analysis for a multi-business-unit SaaS company (Skyvera). You help executives explore scenarios through natural conversation.

YOUR ROLE:
- Act as a thoughtful strategic advisor, not a form filler
- Ask clarifying questions when scenarios are ambiguous
- Provide context-aware suggestions based on historical data
- Help users refine scenarios iteratively
- Show intermediate reasoning and calculations
- Highlight risks, uncertainties, and cascading effects
- Compare multiple scenario versions side-by-side
- Provide actionable recommendations with confidence levels

BUSINESS CONTEXT:
Skyvera has three business units:
- Cloudsense: Largest BU (~$8M quarterly revenue, 59.2% net margin)
- Kandy: Mid-size BU (~$3.3M quarterly revenue, 63.2% net margin)
- STL: Smaller BU (~$1M quarterly revenue, 61.2% net margin)

Key financial metrics tracked:
- Recurring Revenue (RR) and ARR (Annual Recurring Revenue)
- Non-Recurring Revenue (NRR)
- EBITDA and Net Margin %
- Headcount costs
- Customer count and ARR per customer

CONVERSATION STYLE:
- Be conversational and strategic, not robotic
- Ask ONE question at a time (don't overwhelm with 5 questions)
- When ambiguity exists, provide smart defaults based on historical patterns
- Show your reasoning: "Given Cloudsense's current margin, a 15% price increase would..."
- Acknowledge uncertainty: "This assumes customer retention stays constant, which is uncertain"
- Compare scenarios: "Version 2 improves margin by 3% vs Version 1, but at higher risk"

HANDLING AMBIGUITY:
When a user says something like "What if we change pricing?", ask:
1. Which product/BU?
2. Increase or decrease? By how much?
3. When would this take effect?
4. Do we expect any customer churn?

But ALSO provide smart defaults:
"I'll assume you mean Cloudsense (largest BU), a +10% price increase (common), and 5% churn risk (industry average). We can adjust these."

ITERATIVE REFINEMENT:
When showing results:
1. Present the impact clearly with visualized metrics
2. Highlight the most important changes
3. Ask: "Would you like to adjust any assumptions?"
4. Suggest 2-3 alternative scenarios to explore
5. Show sensitivity: "A 1% change in churn could swing EBITDA by $XXX"

OUTPUT FORMATS:
For clarification questions, return JSON:
{
  "needsClarification": true,
  "questions": ["Which business unit?", "What % change?"],
  "suggestedDefaults": { "bu": "Cloudsense", "pricingChange": 10 },
  "readyToAnalyze": false,
  "confidence": "LOW"
}

For scenario analysis, return structured analysis (see scenario-impact format).

For refinement suggestions:
{
  "currentIssues": ["High churn risk", "Margin below target"],
  "suggestions": [
    {
      "parameter": "pricingChange",
      "currentValue": 15,
      "suggestedValue": 10,
      "reasoning": "Lower increase reduces churn risk while still improving margin"
    }
  ],
  "alternativeScenarios": [
    {
      "name": "Conservative approach",
      "description": "5% price increase with targeted accounts only",
      "expectedOutcome": "Lower revenue gain but minimal churn risk"
    }
  ]
}

CRITICAL RULES:
- Always consider cascading effects (e.g., headcount cuts → customer satisfaction → churn)
- Flag unrealistic assumptions (e.g., 50% price increase)
- Provide confidence levels for all predictions
- Reference historical data when available
- Never create scenarios in isolation - always consider business context
- If unsure, ask rather than assume
`
}

/**
 * Build initial scenario interpretation prompt
 */
export function buildInitialScenarioPrompt(
  userQuery: string,
  baselineData: Record<string, number>
): string {
  const baselineList = Object.entries(baselineData)
    .map(([key, value]) => `- ${key}: ${value.toLocaleString()}`)
    .join('\n')

  return `A user wants to explore a what-if scenario. Interpret their query and determine if you need clarification or can proceed with analysis.

USER QUERY:
"${userQuery}"

CURRENT BASELINE METRICS:
${baselineList}

TASK:
1. Parse the user's intent
2. Identify what scenario type this is (financial, headcount, customer, acquisition, etc.)
3. Extract any parameters mentioned
4. Identify what's ambiguous or missing
5. If you need clarification, ask focused questions with smart defaults
6. If you have enough info, extract the scenario parameters

Return JSON with either:
- Clarification request (if ambiguous)
- Scenario parameters (if clear enough to proceed)

Example clarification response:
{
  "needsClarification": true,
  "questions": ["Which business unit should this apply to? (Cloudsense, Kandy, STL, or All)"],
  "suggestedDefaults": { "affectedBU": "All" },
  "partialScenario": {
    "type": "financial",
    "pricingChange": 10
  },
  "readyToAnalyze": false,
  "confidence": "MEDIUM",
  "reasoning": "User specified 10% price increase but didn't specify which BU. Defaulting to All BUs unless specified."
}

Example ready-to-analyze response:
{
  "needsClarification": false,
  "questions": [],
  "scenarioParameters": {
    "type": "financial",
    "description": "10% price increase across all business units",
    "pricingChange": 10,
    "costChange": 0,
    "affectedBU": "All"
  },
  "readyToAnalyze": true,
  "confidence": "HIGH",
  "reasoning": "Clear pricing change specified, applying to all BUs as stated."
}

Return valid JSON only.`
}

/**
 * Build conversation continuation prompt
 */
export function buildContinuationPrompt(context: ConversationContext): string {
  const messageHistory = context.previousMessages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n')

  const baselineList = Object.entries(context.baselineData)
    .map(([key, value]) => `- ${key}: ${value.toLocaleString()}`)
    .join('\n')

  const scenarioInfo = context.currentScenario
    ? `
CURRENT SCENARIO STATE:
Type: ${context.currentScenario.type || 'Not set'}
Description: ${context.currentScenario.description || 'Not set'}
Parameters: ${JSON.stringify(context.currentScenario.parameters || {}, null, 2)}
Ambiguities: ${context.currentScenario.ambiguities?.join(', ') || 'None'}
`
    : 'No scenario defined yet.'

  return `Continue this scenario planning conversation. The user is iterating on a what-if scenario.

CONVERSATION HISTORY:
${messageHistory}

CURRENT BASELINE METRICS:
${baselineList}

${scenarioInfo}

ITERATION: ${context.iterationCount}

TASK:
Based on the conversation history and the user's latest message, determine the appropriate response:

1. **If user answered clarifying questions**: Extract the information and proceed with analysis
2. **If user wants to refine the scenario**: Suggest improvements and alternatives
3. **If user asked a follow-up question**: Answer it with relevant analysis
4. **If user wants to explore alternatives**: Suggest 2-3 alternative scenarios
5. **If user wants to compare versions**: Provide side-by-side comparison

RESPONSE GUIDELINES:
- Be conversational and strategic
- Show your reasoning step-by-step
- Highlight key insights and risks
- Suggest next steps
- Provide confidence levels

Return structured JSON based on the intent:
- Clarification needed → ClarificationResponse
- Ready to analyze → ScenarioParameters
- Refinement suggestions → ScenarioRefinementSuggestion
- Analysis ready → Full scenario impact analysis

Be intelligent about context - don't ask questions that were already answered.`
}

/**
 * Build scenario refinement prompt
 */
export function buildRefinementPrompt(
  currentScenario: any,
  currentResults: any,
  userFeedback?: string
): string {
  return `The user has reviewed scenario results and ${userFeedback ? `provided feedback: "${userFeedback}"` : 'wants to refine the scenario'}.

CURRENT SCENARIO:
${JSON.stringify(currentScenario, null, 2)}

CURRENT RESULTS:
${JSON.stringify(currentResults, null, 2)}

TASK:
Analyze the current scenario and results, then suggest improvements:

1. **Identify issues**:
   - Is the scenario realistic?
   - Are there concerning risks?
   - Does it meet business objectives?

2. **Suggest parameter adjustments**:
   - What values could be tweaked?
   - What would improve the outcome?
   - What reduces risk?

3. **Propose alternatives**:
   - Different approaches to achieve similar goals
   - Conservative vs aggressive options
   - Hybrid scenarios

4. **Sensitivity analysis**:
   - Which parameters have the biggest impact?
   - What's the acceptable range?

Return JSON with refinement suggestions:
{
  "currentIssues": ["Issue 1", "Issue 2"],
  "suggestions": [
    {
      "parameter": "pricingChange",
      "currentValue": 15,
      "suggestedValue": 10,
      "reasoning": "Reduces churn risk while maintaining margin improvement",
      "expectedImpact": "EBITDA +$500K instead of +$750K, but 5% less churn"
    }
  ],
  "alternativeScenarios": [
    {
      "name": "Phased approach",
      "description": "5% increase in Q1, evaluate, then another 5% in Q3",
      "expectedOutcome": "Lower risk, customer feedback loop, similar revenue",
      "parameters": { "pricingChange": 5 }
    }
  ],
  "sensitivityAnalysis": {
    "mostImpactful": "churnRate",
    "acceptableRange": "5-10%",
    "reasoning": "1% churn change = $100K EBITDA swing"
  }
}

Be specific and actionable. Think like a strategic advisor.`
}

/**
 * Build comparison prompt for multiple scenario versions
 */
export function buildComparisonPrompt(versions: any[]): string {
  const versionSummaries = versions
    .map(
      (v, i) => `
VERSION ${i + 1}: ${v.label || 'Unnamed'}
${JSON.stringify(v.scenarioData, null, 2)}

RESULTS:
${JSON.stringify(v.calculatedMetrics, null, 2)}
`
    )
    .join('\n---\n')

  return `Compare these scenario versions and provide strategic guidance on which to pursue.

VERSIONS TO COMPARE:
${versionSummaries}

TASK:
Provide a strategic comparison:

1. **Key differences**: What changed between versions?
2. **Trade-offs**: What does each version optimize for?
3. **Risk comparison**: Which has higher/lower risk?
4. **Recommendation**: Which version is best and why?
5. **Hybrid option**: Could you combine elements from multiple versions?

Return JSON:
{
  "keyDifferences": [
    {
      "metric": "Revenue",
      "version1": 1000000,
      "version2": 1100000,
      "difference": 100000,
      "significance": "Moderate increase but higher churn risk"
    }
  ],
  "tradeoffs": {
    "version1": "Lower risk, lower reward",
    "version2": "Higher reward, higher risk"
  },
  "riskComparison": {
    "lowest": 1,
    "highest": 2,
    "reasoning": "Version 2 assumes aggressive pricing with uncertain customer acceptance"
  },
  "recommendation": {
    "preferredVersion": 1,
    "reasoning": "More sustainable approach with lower churn risk",
    "confidence": "HIGH"
  },
  "hybridOption": {
    "description": "Use Version 1 pricing but Version 2 cost reduction strategy",
    "expectedOutcome": "Balanced risk/reward"
  }
}

Be analytical but practical. Think like a CFO reviewing options.`
}
