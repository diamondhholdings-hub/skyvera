/**
 * POST /api/dm-strategy/accept-recommendation
 * Accept a recommendation and optionally create an action item
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

    if (!actionItem) {
      return NextResponse.json(
        { error: 'actionItem details are required' },
        { status: 400 }
      )
    }

    // Validate action item fields
    const { assignedTo, dueDate, priority, board, notes } = actionItem
    if (!assignedTo || !dueDate || !priority || !board) {
      return NextResponse.json(
        { error: 'assignedTo, dueDate, priority, and board are required' },
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
