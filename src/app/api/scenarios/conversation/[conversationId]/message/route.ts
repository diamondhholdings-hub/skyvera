/**
 * POST /api/scenarios/conversation/[conversationId]/message
 * Send a message in an existing conversation
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getConversationManager, type ConversationState } from '@/lib/intelligence/scenarios/conversation-manager'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'
import { prisma } from '@/lib/db/prisma'

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    // Parse and validate request
    const body = await request.json()
    const validation = messageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { message } = validation.data

    // Get conversation from database
    const conversation = await prisma.scenarioConversation.findUnique({
      where: { conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        versions: {
          orderBy: { versionNumber: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        {
          error: 'Conversation not found',
        },
        { status: 404 }
      )
    }

    if (conversation.status !== 'active') {
      return NextResponse.json(
        {
          error: 'Conversation is not active',
        },
        { status: 400 }
      )
    }

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

    // Build conversation state
    const conversationState: ConversationState = {
      conversationId: conversation.conversationId,
      title: conversation.title || undefined,
      status: conversation.status as 'active' | 'completed' | 'archived',
      currentScenario: conversation.currentScenario
        ? JSON.parse(conversation.currentScenario)
        : undefined,
      scenarioType: conversation.scenarioType || undefined,
      messages: conversation.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        messageType: m.messageType as any,
        timestamp: m.createdAt,
        metadata: {
          tokensUsed: m.tokensUsed || undefined,
          confidence: m.confidence || undefined,
        },
      })),
      versions: conversation.versions.map((v) => ({
        versionNumber: v.versionNumber,
        scenarioData: JSON.parse(v.scenarioData),
        scenarioType: v.scenarioType,
        calculatedMetrics: JSON.parse(v.calculatedMetrics),
        claudeAnalysis: v.claudeAnalysis ? JSON.parse(v.claudeAnalysis) : undefined,
        impactSummary: v.impactSummary || undefined,
        keyChanges: v.keyChanges ? JSON.parse(v.keyChanges) : undefined,
        label: v.label || undefined,
        notes: v.notes || undefined,
        createdAt: v.createdAt,
      })),
      messageCount: conversation.messageCount,
      iterationCount: conversation.iterationCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessageAt: conversation.lastMessageAt,
    }

    // Continue conversation with AI
    const manager = getConversationManager()
    const result = await manager.continueConversation(conversationState, message, baseline)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to process message',
          details: result.error.message,
        },
        { status: 500 }
      )
    }

    const conversationResponse = result.value

    // Add user message to database
    await prisma.scenarioMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: message,
        messageType: 'query',
      },
    })

    // Add assistant response to database
    await prisma.scenarioMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: conversationResponse.message,
        messageType: conversationResponse.type,
      },
    })

    // Update conversation metadata
    await prisma.scenarioConversation.update({
      where: { conversationId },
      data: {
        messageCount: { increment: 2 },
        iterationCount: conversationResponse.type === 'analysis' ? { increment: 1 } : undefined,
        lastMessageAt: new Date(),
        currentScenario:
          conversationResponse.type === 'analysis'
            ? JSON.stringify(conversationResponse.data.scenarioInput)
            : undefined,
        scenarioType:
          conversationResponse.type === 'analysis'
            ? conversationResponse.data.scenarioInput.type
            : undefined,
      },
    })

    // If this was an analysis, save as a version
    if (conversationResponse.type === 'analysis') {
      const versionNumber = conversation.versions.length + 1
      await prisma.scenarioVersion.create({
        data: {
          conversationId,
          versionNumber,
          scenarioData: JSON.stringify(conversationResponse.data.scenarioInput),
          scenarioType: conversationResponse.data.scenarioInput.type,
          calculatedMetrics: JSON.stringify(conversationResponse.data.calculatedMetrics),
          claudeAnalysis: conversationResponse.data.claudeAnalysis
            ? JSON.stringify(conversationResponse.data.claudeAnalysis)
            : null,
          impactSummary: conversationResponse.data.claudeAnalysis?.impactSummary,
          label: `Version ${versionNumber}`,
        },
      })
    }

    // Fetch updated conversation
    const updatedConversation = await prisma.scenarioConversation.findUnique({
      where: { conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        versions: {
          orderBy: { versionNumber: 'asc' },
        },
      },
    })

    return NextResponse.json({
      conversationId,
      response: conversationResponse,
      messages: updatedConversation?.messages || [],
      versions: updatedConversation?.versions || [],
    })
  } catch (error) {
    console.error('[POST /api/scenarios/conversation/[conversationId]/message] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
