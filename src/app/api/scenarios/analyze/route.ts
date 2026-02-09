/**
 * POST /api/scenarios/analyze
 * Analyze what-if scenario and return calculated metrics + Claude analysis
 */

import { NextResponse } from 'next/server'
import { scenarioInputSchema } from '@/lib/intelligence/scenarios/types'
import { ScenarioCalculator } from '@/lib/intelligence/scenarios/calculator'
import { analyzeScenarioWithClaude } from '@/lib/intelligence/scenarios/analyzer'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate scenario input with Zod
    const validation = scenarioInputSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid scenario input',
          details: validation.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const scenarioInput = validation.data

    // Get baseline metrics
    const baselineResult = await getBaselineMetrics()
    if (!baselineResult.success) {
      console.error('[POST /api/scenarios/analyze] Failed to fetch baseline:', baselineResult.error)
      return NextResponse.json(
        {
          error: 'Failed to fetch baseline metrics',
          details: baselineResult.error.message,
        },
        { status: 500 }
      )
    }

    const baseline = baselineResult.value

    // Calculate impact metrics
    const calculator = new ScenarioCalculator()
    const calculatedMetrics = calculator.calculate(scenarioInput, baseline)

    // Get Claude analysis
    const analysisResult = await analyzeScenarioWithClaude(
      scenarioInput,
      calculatedMetrics,
      baseline
    )

    // Return results (Claude analysis can be null if unavailable)
    return NextResponse.json({
      calculatedMetrics,
      claudeAnalysis: analysisResult.success ? analysisResult.value : null,
      baseline,
    })
  } catch (error) {
    console.error('[POST /api/scenarios/analyze] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
