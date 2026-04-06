/**
 * POST /api/dm-strategy/analyze-account
 * Analyze single account for DM% retention recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeAccount } from '@/lib/intelligence/dm-strategy/analyzer'
import { prisma } from '@/lib/db/prisma'
import { rateLimit, rateLimitHeaders } from '@/lib/middleware/rate-limit'
import { dmStrategyAnalyzeAccountSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute (Claude API call)
  const rl = rateLimit(request, { limit: 10, window: 60_000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rl.reset },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const rawBody = await request.json().catch(() => ({}))
    const validation = dmStrategyAnalyzeAccountSchema.safeParse(rawBody)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }
    const { accountName } = validation.data

    // Run analysis
    const analysisResult = await analyzeAccount(accountName)

    if (!analysisResult.success) {
      return NextResponse.json(
        { error: analysisResult.error.message },
        { status: 500 }
      )
    }

    const analysis = analysisResult.value

    // Save recommendations to database
    for (const recommendation of analysis.recommendations) {
      // Check if recommendation already exists
      const existing = await prisma.dMRecommendation.findUnique({
        where: { recommendationId: recommendation.recommendationId },
      })

      if (!existing) {
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

    return NextResponse.json({
      success: true,
      analysis: {
        accountName: analysis.accountName,
        bu: analysis.bu,
        currentDM: analysis.currentDM,
        projectedDM: analysis.projectedDM,
        targetDM: analysis.targetDM,
        atRisk: analysis.atRisk,
        riskFactors: analysis.riskFactors,
        hasGrowthOpportunity: analysis.hasGrowthOpportunity,
        opportunityFactors: analysis.opportunityFactors,
        currentARR: analysis.currentARR,
        projectedARRImpact: analysis.projectedARRImpact,
        recommendations: analysis.recommendations,
        analyzedAt: analysis.analyzedAt,
      },
    })
  } catch (error) {
    console.error('DM Strategy Account Analysis Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to analyze account',
      },
      { status: 500 }
    )
  }
}
