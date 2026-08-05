/**
 * POST /api/dm-strategy/accept-recommendation
 * Accept a recommendation, optionally creating an action item.
 * If `actionItem` is omitted, this is a quick accept: the recommendation's
 * status moves to 'in_progress' without an action item attached.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const {
      recommendationId,
      actionItem
    } = await request.json()

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

    // Quick accept: no action item details provided
    if (!actionItem) {
      const updated = await prisma.dMRecommendation.update({
        where: { recommendationId },
        data: {
          status: 'in_progress',
          acceptedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        recommendation: updated,
        message: 'Recommendation accepted',
      })
    }

    // Validate action item fields
    const { assignedTo, dueDate, priority, board, notes } = actionItem
    if (!assignedTo || !dueDate || !priority || !board) {
      return NextResponse.json(
        { error: 'assignedTo, dueDate, priority, and board are required' },
        { status: 400 }
      )
    }

    // Create action item
    const createdActionItem = await prisma.actionItem.create({
      data: {
        recommendationId,
        assignedTo,
        dueDate: new Date(dueDate),
        priority,
        board,
        notes: notes || null,
        status: 'todo',
      },
    })

    // Update recommendation status and link to action item
    const updated = await prisma.dMRecommendation.update({
      where: { recommendationId },
      data: {
        status: 'in_progress',
        acceptedAt: new Date(),
        linkedActionItemId: createdActionItem.actionItemId,
      },
    })

    return NextResponse.json({
      success: true,
      recommendation: updated,
      actionItem: createdActionItem,
      message: 'Recommendation accepted and action item created',
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
