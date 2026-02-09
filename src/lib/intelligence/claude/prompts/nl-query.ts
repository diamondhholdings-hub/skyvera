/**
 * Natural language query prompt builder
 * Generates prompts for conversational business intelligence queries
 */

export function buildNLQueryPrompt(
  query: string,
  availableData: string[],
  previousContext?: string
): string {
  const contextSection = previousContext
    ? `
CONVERSATION CONTEXT:
${previousContext}

The user's current query may reference previous questions or answers. Use the context above to interpret the query.
`
    : ''

  const dataList = availableData.map((source) => `- ${source}`).join('\n')

  return `You are helping a business user query Skyvera's financial data through natural language.

USER QUERY:
"${query}"
${contextSection}
AVAILABLE DATA SOURCES:
${dataList}

INSTRUCTIONS:

1. **Interpret the Query**:
   - What is the user asking for?
   - What metrics/data are relevant?
   - Are there ambiguities or unclear parts?

2. **Check Data Availability**:
   - Can this query be answered with available data?
   - If no: explain what data is missing
   - If ambiguous: ask clarifying questions

3. **Provide Answer**:
   - If the query can be answered: provide a clear, concise answer
   - Include specific numbers and data points
   - Cite which data sources were used
   - Use business language (avoid jargon unless the user uses it)

4. **Handle Multi-Turn Conversations**:
   - If previous context exists, reference it naturally
   - Support follow-up questions like "What about for Kandy?" or "How does that compare to last quarter?"

5. **Clarification Handling**:
   - If the query is ambiguous, ask ONE specific clarifying question
   - Offer 2-3 options if the user might mean different things
   - Examples:
     * "Which business unit: Cloudsense, Kandy, or STL?"
     * "Time period: current quarter (Q1'26) or last quarter (Q4'25)?"

Return your response as valid JSON:
{
  "interpretation": "What the user is asking for",
  "answer": "The answer to their query (if answerable)",
  "dataPoints": {
    "metricName": value,
    "anotherMetric": value
  },
  "needsClarification": true | false,
  "clarificationQuestion": "Specific question to ask the user (if needsClarification=true)",
  "clarificationOptions": ["Option 1", "Option 2", "Option 3"],
  "sources": ["Data source 1", "Data source 2"],
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "suggestedFollowUps": ["Follow-up question 1", "Follow-up question 2"]
}

EXAMPLES OF GOOD RESPONSES:

Query: "What's Cloudsense ARR?"
Response: {
  "interpretation": "User wants the Annual Recurring Revenue for Cloudsense business unit",
  "answer": "Cloudsense ARR is $32.0M for Q1'26 (calculated as $8.0M quarterly RR × 4)",
  "dataPoints": { "Cloudsense ARR": 32000000, "Cloudsense Quarterly RR": 8000000 },
  "needsClarification": false,
  "sources": ["RR Summary sheet"],
  "confidence": "HIGH",
  "suggestedFollowUps": ["How does this compare to Kandy?", "What's the trend over time?"]
}

Query: "What's the margin?"
Response: {
  "interpretation": "User asked about 'margin' but didn't specify which type or business unit",
  "answer": null,
  "needsClarification": true,
  "clarificationQuestion": "Which margin and for which business unit?",
  "clarificationOptions": [
    "Gross Margin for a specific BU (Cloudsense/Kandy/STL)",
    "Net Margin for a specific BU",
    "Company-wide margin"
  ],
  "confidence": "LOW"
}`
}
