/**
 * GET /api/dm-strategy/impact-calculator
 * Calculate projected impact of accepted recommendations
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { projectScenario } from '@/lib/intelligence/dm-strategy/impact-calculator'
import { DMRecommendation } from '@/lib/intelligence/dm-strategy/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bu = searchParams.get('bu')
    const status = searchParams.get('status') || 'accepted'

    // Fetch accepted recommendations
    const where: Record<string, unknown> = { status }
    if (bu) where.bu = bu

    const recommendations = await prisma.dMRecommendation.findMany({
      where,
    })

    if (recommendations.length === 0) {
      return NextResponse.json({
        success: true,
        projection: null,
        message: 'No recommendations found for impact calculation',
      })
    }

    // Convert to DMRecommendation format
    const dmRecommendations: DMRecommendation[] = recommendations.map((rec) => ({
      recommendationId: rec.recommendationId,
      accountName: rec.accountName,
      bu: rec.bu,
      type: rec.type as DMRecommendation['type'],
      priority: rec.priority as DMRecommendation['priority'],
      title: rec.title,
      description: rec.description,
      reasoning: rec.reasoning,
      impact: {
        arrImpact: rec.arrImpact,
        dmImpact: rec.dmImpact,
        marginImpact: rec.marginImpact,
        confidenceLevel: rec.confidenceLevel,
      },
      timeline: rec.timeline as DMRecommendation['timeline'],
      ownerTeam: rec.ownerTeam as DMRecommendation['ownerTeam'],
      risk: rec.risk as DMRecommendation['risk'],
      status: rec.status as DMRecommendation['status'],
    }))

    // Project scenario
    const projectionResult = await projectScenario(dmRecommendations, bu || undefined)

    if (!projectionResult.success) {
      return NextResponse.json(
        { error: projectionResult.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      projection: projectionResult.value,
      recommendationsCount: recommendations.length,
    })
  } catch (error) {
    console.error('Impact Calculator Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to calculate impact',
      },
      { status: 500 }
    )
  }
}
