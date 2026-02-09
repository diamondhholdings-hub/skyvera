/**
 * Claude-powered scenario impact analysis
 * Provides risk assessment and recommendations for what-if scenarios
 */

import { getOrchestrator } from '@/lib/intelligence/claude/orchestrator'
import { buildScenarioPrompt, type Scenario } from '@/lib/intelligence/claude/prompts/scenario-impact'
import { scenarioImpactResponseSchema, type ScenarioInput, type ImpactMetric, type ScenarioImpactResponse } from './types'
import type { BaselineMetrics } from '@/lib/data/server/scenario-data'
import { ok, err, type Result } from '@/lib/types/result'

/**
 * Analyze scenario with Claude for impact assessment
 */
export async function analyzeScenarioWithClaude(
  input: ScenarioInput,
  calculatedMetrics: ImpactMetric[],
  baseline: BaselineMetrics
): Promise<Result<ScenarioImpactResponse, Error>> {
  try {
    // Build scenario object for prompt
    const scenario: Scenario = {
      type: input.type,
      description: input.description,
      parameters: extractParameters(input),
      baselineData: {
        'Total Revenue': baseline.totalRevenue,
        'Recurring Revenue': baseline.totalRR,
        'Non-Recurring Revenue': baseline.totalNRR,
        'EBITDA': baseline.ebitda,
        'Net Margin %': baseline.netMarginPct,
        'Headcount': baseline.headcount,
        'Customer Count': baseline.customerCount,
      },
    }

    // Build prompt
    const prompt = buildScenarioPrompt(scenario)

    // Call Claude via orchestrator
    const orchestrator = getOrchestrator()
    const response = await orchestrator.processRequest({
      prompt,
      priority: 'HIGH',
      maxTokens: 4096,
      temperature: 0.7,
    })

    if (!response.success) {
      // If Claude unavailable (no API key), return mock analysis
      if (response.error.message.includes('ANTHROPIC_API_KEY not configured')) {
        return ok(createMockAnalysis(calculatedMetrics))
      }
      return err(response.error)
    }

    // Parse and validate JSON response
    let parsed: unknown
    try {
      parsed = JSON.parse(response.value.content)
    } catch (parseError) {
      return err(new Error('Failed to parse Claude response as JSON'))
    }

    const validation = scenarioImpactResponseSchema.safeParse(parsed)
    if (!validation.success) {
      console.error('[analyzeScenarioWithClaude] Validation failed:', validation.error)
      return err(new Error(`Claude response validation failed: ${validation.error.message}`))
    }

    return ok(validation.data)
  } catch (error) {
    console.error('[analyzeScenarioWithClaude] Unexpected error:', error)
    return err(
      new Error(
        `Scenario analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Extract parameters from scenario input for prompt
 */
function extractParameters(input: ScenarioInput): Record<string, number> {
  switch (input.type) {
    case 'financial':
      return {
        'Pricing Change %': input.pricingChange,
        'Cost Change %': input.costChange,
        'Target Margin %': input.targetMargin,
      }
    case 'headcount':
      return {
        'Headcount Change': input.headcountChange,
        'Avg Salary Cost': input.avgSalaryCost,
      }
    case 'customer':
      return {
        'Churn Rate %': input.churnRate,
        'Acquisition Count': input.acquisitionCount,
        'Avg Customer ARR': input.avgCustomerARR,
      }
  }
}

/**
 * Create mock analysis when Claude is unavailable
 */
function createMockAnalysis(calculatedMetrics: ImpactMetric[]): ScenarioImpactResponse {
  return {
    impactSummary: 'Claude analysis unavailable - displaying calculated metrics only. Configure ANTHROPIC_API_KEY for AI-powered impact analysis.',
    affectedMetrics: calculatedMetrics.map((m) => ({
      name: m.name,
      before: m.before,
      after: m.after,
      change: m.change,
      changePercent: m.changePercent,
    })),
    risks: [],
    recommendation: 'APPROVE_WITH_CONDITIONS',
    reasoning: 'Unable to provide AI-powered recommendation without Claude API access.',
    conditions: ['Review calculated metrics manually', 'Validate assumptions with finance team'],
    confidence: 'LOW',
  }
}
