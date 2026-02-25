/**
 * POST /api/scenarios/conversation/[conversationId]/message
 * Send a message in an existing conversation (stateless — state passed from client)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getConversationManager, type ConversationState } from '@/lib/intelligence/scenarios/conversation-manager'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationState: z.any(), // Full state from previous response
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    const body = await request.json()
    const validation = messageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { message, conversationState: clientState } = validation.data

    if (!clientState) {
      return NextResponse.json(
        { error: 'conversationState is required' },
        { status: 400 }
      )
    }

    // Get baseline metrics
    const baselineResult = await getBaselineMetrics()
    if (!baselineResult.success) {
      return NextResponse.json(
        { error: 'Failed to fetch baseline metrics', details: baselineResult.error.message },
        { status: 500 }
      )
    }

    // Rehydrate dates from JSON (dates come as strings over the wire)
    const conversationState: ConversationState = {
      ...clientState,
      conversationId,
      status: clientState.status || 'active',
      messages: (clientState.messages || []).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
      versions: (clientState.versions || []).map((v: any) => ({
        ...v,
        createdAt: new Date(v.createdAt),
      })),
      createdAt: new Date(clientState.createdAt || Date.now()),
      updatedAt: new Date(clientState.updatedAt || Date.now()),
      lastMessageAt: new Date(clientState.lastMessageAt || Date.now()),
    }

    // Continue conversation with AI
    const manager = getConversationManager()
    const result = await manager.continueConversation(conversationState, message, baselineResult.value)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to process message', details: result.error.message },
        { status: 500 }
      )
    }

    const conversationResponse = result.value
    const now = new Date()

    // Build updated messages list
    const updatedMessages = [
      ...conversationState.messages,
      { role: 'user' as const, content: message, messageType: 'query' as const, timestamp: now },
      {
        role: 'assistant' as const,
        content: conversationResponse.message,
        messageType: conversationResponse.type as any,
        timestamp: now,
      },
    ]

    // Build updated versions if this was an analysis
    const updatedVersions = [...conversationState.versions]
    if (conversationResponse.type === 'analysis') {
      updatedVersions.push({
        versionNumber: updatedVersions.length + 1,
        scenarioData: conversationResponse.data?.scenarioInput,
        scenarioType: conversationResponse.data?.scenarioInput?.type,
        calculatedMetrics: conversationResponse.data?.calculatedMetrics || [],
        claudeAnalysis: conversationResponse.data?.claudeAnalysis,
        impactSummary: conversationResponse.data?.claudeAnalysis?.impactSummary,
        label: `Version ${updatedVersions.length + 1}`,
        createdAt: now,
      })
    }

    // Return updated conversation state for the client to store
    const updatedState: ConversationState = {
      ...conversationState,
      messages: updatedMessages,
      versions: updatedVersions,
      messageCount: conversationState.messageCount + 2,
      iterationCount: conversationResponse.type === 'analysis'
        ? conversationState.iterationCount + 1
        : conversationState.iterationCount,
      currentScenario: conversationResponse.type === 'analysis'
        ? conversationResponse.data?.scenarioInput
        : conversationState.currentScenario,
      scenarioType: conversationResponse.type === 'analysis'
        ? conversationResponse.data?.scenarioInput?.type
        : conversationState.scenarioType,
      updatedAt: now,
      lastMessageAt: now,
    }

    return NextResponse.json({
      conversationId,
      response: conversationResponse,
      messages: updatedMessages,
      versions: updatedVersions,
      conversationState: updatedState,
    })
  } catch (error) {
    console.error('[POST /api/scenarios/conversation/[conversationId]/message] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
