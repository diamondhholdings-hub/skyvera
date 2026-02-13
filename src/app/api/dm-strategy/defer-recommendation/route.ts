/**
 * POST /api/dm-strategy/defer-recommendation
 * Defer a recommendation with a reason
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const { recommendationId, reason } = await request.json()

    if (!recommendationId) {
      return NextResponse.json(
        { error: 'recommendationId is required' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required when deferring' },
        { status: 400 }
      )
    }

    // Fetch recommendation
    const recommendation = await prisma.dMRecommendation.findUnique({
      where: { recommendationId },
    })

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    // Update recommendation status (use 'dismissed' to match data layer schema)
    const updated = await prisma.dMRecommendation.update({
      where: { recommendationId },
      data: {
        status: 'dismissed',
        deferredReason: reason,
      },
    })

    return NextResponse.json({
      success: true,
      recommendation: updated,
      message: 'Recommendation deferred',
    })
  } catch (error) {
    console.error('Defer Recommendation Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to defer recommendation',
      },
      { status: 500 }
    )
  }
}
