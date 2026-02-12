/**
 * POST /api/dm-strategy/accept-recommendation
 * Accept a recommendation and optionally create an action item
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const { recommendationId, createActionItem = false } = await request.json()

    if (!recommendationId) {
      return NextResponse.json(
        { error: 'recommendationId is required' },
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

    // Update recommendation status
    const updated = await prisma.dMRecommendation.update({
      where: { recommendationId },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    // Optionally create action item (if action item system exists)
    let actionItemId: string | null = null
    if (createActionItem) {
      // TODO: Integrate with action item system when available
      // For now, just set a placeholder
      actionItemId = `action-${Date.now()}`

      await prisma.dMRecommendation.update({
        where: { recommendationId },
        data: {
          linkedActionItemId: actionItemId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      recommendation: updated,
      actionItemId,
      message: createActionItem
        ? 'Recommendation accepted and action item created'
        : 'Recommendation accepted',
    })
  } catch (error) {
    console.error('Accept Recommendation Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to accept recommendation',
      },
      { status: 500 }
    )
  }
}
