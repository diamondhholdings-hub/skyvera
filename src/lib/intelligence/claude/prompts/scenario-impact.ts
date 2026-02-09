/**
 * Scenario analysis prompt builder
 * Generates prompts for what-if scenario modeling
 */

export interface Scenario {
  type: 'financial' | 'headcount' | 'customer'
  description: string
  parameters: Record<string, number>
  baselineData: Record<string, number>
}

export function buildScenarioPrompt(scenario: Scenario): string {
  const parameterList = Object.entries(scenario.parameters)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n')

  const baselineList = Object.entries(scenario.baselineData)
    .map(([key, value]) => `- ${key}: ${typeof value === 'number' ? value.toLocaleString() : value}`)
    .join('\n')

  return `Analyze the impact of the following scenario change:

SCENARIO TYPE: ${scenario.type.toUpperCase()}

DESCRIPTION:
${scenario.description}

SCENARIO PARAMETERS:
${parameterList}

CURRENT BASELINE METRICS:
${baselineList}

ANALYSIS REQUIRED:

1. **Impact Summary**:
   - High-level overview of the scenario's business impact
   - Who/what is affected (business units, teams, customers)

2. **Affected Metrics**:
   - Identify all metrics that would change
   - Provide before/after values with % change
   - Show calculations where relevant

3. **Risk Assessment**:
   - Identify risks introduced by this change
   - Categorize by severity (HIGH/MEDIUM/LOW)
   - Consider cascading effects (e.g., headcount cuts affect customer satisfaction)

4. **Recommendation**:
   - Should this scenario be pursued? (APPROVE / APPROVE_WITH_CONDITIONS / REJECT)
   - Conditions or modifications to improve the scenario
   - Alternative approaches to consider

Return your analysis as valid JSON:
{
  "impactSummary": "Overview of business impact",
  "affectedMetrics": [
    {
      "name": "Metric name",
      "before": numeric_value,
      "after": numeric_value,
      "change": numeric_change,
      "changePercent": numeric_percent,
      "calculation": "How this was calculated (optional)"
    }
  ],
  "risks": [
    {
      "description": "Specific risk",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "likelihood": "HIGH" | "MEDIUM" | "LOW",
      "mitigation": "Potential mitigation strategy"
    }
  ],
  "recommendation": "APPROVE" | "APPROVE_WITH_CONDITIONS" | "REJECT",
  "reasoning": "Why this recommendation",
  "conditions": ["Condition 1", "Condition 2"],
  "alternatives": ["Alternative 1", "Alternative 2"],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}`
}
