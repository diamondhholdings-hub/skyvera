/**
 * POST /api/dm-strategy/analyze
 * Analyze all accounts and generate DM% retention recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzePortfolio } from '@/lib/intelligence/dm-strategy/analyzer'
import { prisma } from '@/lib/db/prisma'
import { rateLimit, rateLimitHeaders } from '@/lib/middleware/rate-limit'
import { dmStrategyAnalyzeSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute (expensive portfolio analysis)
  const rl = rateLimit(request, { limit: 10, window: 60_000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rl.reset },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const rawBody = await request.json().catch(() => ({}))
    const validation = dmStrategyAnalyzeSchema.safeParse(rawBody)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }
    const { bu } = validation.data

    // Create analysis run record
    const runId = `run-${Date.now()}`
    await prisma.dMAnalysisRun.create({
      data: {
        runId,
        runDate: new Date(),
        accountsAnalyzed: 0,
        recommendationsGenerated: 0,
        totalPotentialARR: 0,
        totalPotentialDM: 0,
        status: 'running',
        bu: bu || null,
      },
    })

    // Run analysis
    const analysisResult = await analyzePortfolio(bu)

    if (!analysisResult.success) {
      // Update run as failed
      await prisma.dMAnalysisRun.update({
        where: { runId },
        data: {
          status: 'failed',
          error: analysisResult.error.message,
        },
      })

      return NextResponse.json(
        { error: analysisResult.error.message },
        { status: 500 }
      )
    }

    const analysis = analysisResult.value

    // Save recommendations to database
    for (const accountAnalysis of analysis.accountAnalyses) {
      for (const recommendation of accountAnalysis.recommendations) {
        await prisma.dMRecommendation.create({
          data: {
            recommendationId: recommendation.recommendationId,
            accountName: recommendation.accountName,
            bu: recommendation.bu,
            type: recommendation.type,
            priority: recommendation.priority,
            title: recommendation.title,
            description: recommendation.description,
            reasoning: recommendation.reasoning,
            arrImpact: recommendation.impact.arrImpact,
            dmImpact: recommendation.impact.dmImpact,
            marginImpact: recommendation.impact.marginImpact,
            confidenceLevel: recommendation.impact.confidenceLevel,
            timeline: recommendation.timeline,
            ownerTeam: recommendation.ownerTeam,
            risk: recommendation.risk,
            status: 'pending',
          },
        })
      }
    }

    // Update run as completed
    await prisma.dMAnalysisRun.update({
      where: { runId },
      data: {
        status: 'completed',
        accountsAnalyzed: analysis.accountsAnalyzed,
        recommendationsGenerated: analysis.totalRecommendations,
        totalPotentialARR: analysis.projectedARRImpact,
        totalPotentialDM: analysis.projectedDMImprovement,
      },
    })

    return NextResponse.json({
      success: true,
      analysis: {
        runId,
        bu: analysis.bu,
        totalAccounts: analysis.totalAccounts,
        accountsAnalyzed: analysis.accountsAnalyzed,
        currentDM: analysis.currentDM,
        projectedDM: analysis.projectedDM,
        atRiskAccounts: analysis.atRiskAccounts,
        totalARRAtRisk: analysis.totalARRAtRisk,
        growthAccounts: analysis.growthAccounts,
        totalARROpportunity: analysis.totalARROpportunity,
        totalRecommendations: analysis.totalRecommendations,
        recommendationsByType: analysis.recommendationsByType,
        recommendationsByPriority: analysis.recommendationsByPriority,
        projectedARRImpact: analysis.projectedARRImpact,
        projectedDMImprovement: analysis.projectedDMImprovement,
        analyzedAt: analysis.analyzedAt,
      },
    })
  } catch (error) {
    console.error('DM Strategy Analysis Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to analyze portfolio',
      },
      { status: 500 }
    )
  }
}
