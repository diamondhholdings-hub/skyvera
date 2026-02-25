/**
 * POST /api/scenarios/conversation/start
 * Start a new conversational scenario analysis session (stateless - no DB required)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getConversationManager } from '@/lib/intelligence/scenarios/conversation-manager'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'
import { randomUUID } from 'crypto'

const startConversationSchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = startConversationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { query } = validation.data

    // Get baseline metrics
    const baselineResult = await getBaselineMetrics()
    if (!baselineResult.success) {
      return NextResponse.json(
        { error: 'Failed to fetch baseline metrics', details: baselineResult.error.message },
        { status: 500 }
      )
    }

    // Start conversation with AI
    const manager = getConversationManager()
    const result = await manager.startConversation(query, baselineResult.value)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to start conversation', details: result.error.message },
        { status: 500 }
      )
    }

    const conversationResponse = result.value
    const conversationId = randomUUID()
    const now = new Date()

    // Build conversation state to return to client (stateless — client tracks this)
    const messages = [
      {
        role: 'user' as const,
        content: query,
        messageType: 'query' as const,
        timestamp: now,
      },
      {
        role: 'assistant' as const,
        content: conversationResponse.message,
        messageType: conversationResponse.type as any,
        timestamp: now,
      },
    ]

    const conversationState = {
      conversationId,
      title: query.substring(0, 100),
      status: 'active' as const,
      messages,
      versions: [] as any[],
      messageCount: 2,
      iterationCount: 0,
      currentScenario: conversationResponse.type === 'analysis'
        ? conversationResponse.data?.scenarioInput
        : undefined,
      scenarioType: conversationResponse.type === 'analysis'
        ? conversationResponse.data?.scenarioInput?.type
        : undefined,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    }

    return NextResponse.json({
      conversationId,
      title: conversationState.title,
      status: conversationState.status,
      response: conversationResponse,
      messages,
      conversationState,
    })
  } catch (error) {
    console.error('[POST /api/scenarios/conversation/start] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
