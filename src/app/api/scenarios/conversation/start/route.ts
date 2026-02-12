/**
 * POST /api/scenarios/conversation/start
 * Start a new conversational scenario analysis session
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getConversationManager } from '@/lib/intelligence/scenarios/conversation-manager'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'
import { prisma } from '@/lib/db/prisma'

const startConversationSchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters'),
})

export async function POST(request: Request) {
  try {
    // Parse and validate request
    const body = await request.json()
    const validation = startConversationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { query } = validation.data

    // Get baseline metrics
    const baselineResult = await getBaselineMetrics()
    if (!baselineResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to fetch baseline metrics',
          details: baselineResult.error.message,
        },
        { status: 500 }
      )
    }

    const baseline = baselineResult.value

    // Start conversation with AI
    const manager = getConversationManager()
    const result = await manager.startConversation(query, baseline)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to start conversation',
          details: result.error.message,
        },
        { status: 500 }
      )
    }

    const conversationResponse = result.value

    // Create conversation in database
    const conversation = await prisma.scenarioConversation.create({
      data: {
        title: query.substring(0, 100), // Use first 100 chars of query as title
        status: 'active',
        messageCount: 1,
        iterationCount: 0,
        lastMessageAt: new Date(),
        messages: {
          create: [
            {
              role: 'user',
              content: query,
              messageType: 'query',
              createdAt: new Date(),
            },
            {
              role: 'assistant',
              content: conversationResponse.message,
              messageType: conversationResponse.type,
              createdAt: new Date(),
            },
          ],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // Return conversation with response
    return NextResponse.json({
      conversationId: conversation.conversationId,
      title: conversation.title,
      status: conversation.status,
      response: conversationResponse,
      messages: conversation.messages,
    })
  } catch (error) {
    console.error('[POST /api/scenarios/conversation/start] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
