/**
 * POST /api/dm-strategy/defer-recommendation
 * Defer a recommendation with a reason
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { rateLimit, rateLimitHeaders } from '@/lib/middleware/rate-limit'

const deferRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  reason: z.string().min(1),
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
    const validation = deferRecommendationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', issues: validation.error.issues },
        { status: 400 }
      )
    }
    const { recommendationId, reason } = validation.data

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
