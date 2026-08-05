/**
 * POST /api/dm-strategy/accept-recommendation
 * Accept a recommendation, optionally creating an action item.
 * If `actionItem` is omitted, this is a quick accept: the recommendation's
 * status moves to 'in_progress' without an action item attached.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { rateLimit, rateLimitHeaders } from '@/lib/middleware/rate-limit'

const acceptRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  actionItem: z
    .object({
      assignedTo: z.string().min(1),
      dueDate: z.string().min(1),
      priority: z.string().min(1),
      board: z.string().min(1),
      notes: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { limit: 20, window: 60_000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rl.reset },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const body = await request.json()
    const validation = acceptRecommendationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', issues: validation.error.issues },
        { status: 400 }
      )
    }
    const { recommendationId, actionItem } = validation.data

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
