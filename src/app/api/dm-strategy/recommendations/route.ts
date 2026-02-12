/**
 * GET /api/dm-strategy/recommendations
 * Fetch all recommendations with optional filters
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters
    const bu = searchParams.get('bu')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')
    const status = searchParams.get('status') || 'pending'
    const accountName = searchParams.get('accountName')

    // Build where clause
    const where: Record<string, unknown> = {}
    if (bu) where.bu = bu
    if (priority) where.priority = priority
    if (type) where.type = type
    if (status) where.status = status
    if (accountName) where.accountName = accountName

    // Fetch recommendations
    const recommendations = await prisma.dMRecommendation.findMany({
      where,
      orderBy: [
        { priority: 'asc' }, // critical first
        { arrImpact: 'desc' }, // highest impact first
      ],
    })

    // Calculate summary stats
    const summary = {
      total: recommendations.length,
      byPriority: {
        critical: recommendations.filter((r) => r.priority === 'critical').length,
        high: recommendations.filter((r) => r.priority === 'high').length,
        medium: recommendations.filter((r) => r.priority === 'medium').length,
        low: recommendations.filter((r) => r.priority === 'low').length,
      },
      byType: recommendations.reduce(
        (acc, rec) => {
          acc[rec.type] = (acc[rec.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
      totalARRImpact: recommendations.reduce(
        (sum, rec) => sum + rec.arrImpact,
        0
      ),
      totalDMImpact: recommendations.reduce(
        (sum, rec) => sum + rec.dmImpact,
        0
      ),
      avgConfidence:
        recommendations.reduce((sum, rec) => sum + rec.confidenceLevel, 0) /
        (recommendations.length || 1),
    }

    return NextResponse.json({
      success: true,
      recommendations,
      summary,
    })
  } catch (error) {
    console.error('Fetch Recommendations Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch recommendations',
      },
      { status: 500 }
    )
  }
}
