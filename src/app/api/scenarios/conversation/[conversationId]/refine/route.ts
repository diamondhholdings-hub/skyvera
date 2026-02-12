/**
 * POST /api/scenarios/conversation/[conversationId]/refine
 * Get AI-powered refinement suggestions for current scenario
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getConversationManager } from '@/lib/intelligence/scenarios/conversation-manager'
import { prisma } from '@/lib/db/prisma'

const refineSchema = z.object({
  feedback: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    // Parse request
    const body = await request.json()
    const validation = refineSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { feedback } = validation.data

    // Get conversation with latest version
    const conversation = await prisma.scenarioConversation.findUnique({
      where: { conversationId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
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

    if (conversation.versions.length === 0) {
      return NextResponse.json(
        {
          error: 'No scenario versions to refine',
        },
        { status: 400 }
      )
    }

    const latestVersion = conversation.versions[0]
    const currentScenario = JSON.parse(latestVersion.scenarioData)
    const currentResults = {
      calculatedMetrics: JSON.parse(latestVersion.calculatedMetrics),
      claudeAnalysis: latestVersion.claudeAnalysis
        ? JSON.parse(latestVersion.claudeAnalysis)
        : null,
    }

    // Get refinement suggestions
    const manager = getConversationManager()
    const result = await manager.refineScenario(currentScenario, currentResults, feedback)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to generate refinement suggestions',
          details: result.error.message,
        },
        { status: 500 }
      )
    }

    const suggestions = result.value

    // Add refinement message to conversation
    await prisma.scenarioMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: `Here are some suggestions to refine your scenario:\n\n${formatSuggestions(suggestions)}`,
        messageType: 'refinement',
      },
    })

    await prisma.scenarioConversation.update({
      where: { conversationId },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    })

    return NextResponse.json({
      conversationId,
      suggestions,
    })
  } catch (error) {
    console.error('[POST /api/scenarios/conversation/[conversationId]/refine] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }

  function formatSuggestions(suggestions: any): string {
    let text = ''

    if (suggestions.currentIssues && suggestions.currentIssues.length > 0) {
      text += '**Current Issues:**\n'
      suggestions.currentIssues.forEach((issue: string) => {
        text += `- ${issue}\n`
      })
      text += '\n'
    }

    if (suggestions.suggestions && suggestions.suggestions.length > 0) {
      text += '**Suggested Adjustments:**\n'
      suggestions.suggestions.forEach((s: any) => {
        text += `- **${s.parameter}**: ${s.currentValue} → ${s.suggestedValue}\n`
        text += `  ${s.reasoning}\n`
      })
      text += '\n'
    }

    if (suggestions.alternativeScenarios && suggestions.alternativeScenarios.length > 0) {
      text += '**Alternative Scenarios to Consider:**\n'
      suggestions.alternativeScenarios.forEach((alt: any, i: number) => {
        text += `${i + 1}. **${alt.name}**: ${alt.description}\n`
      })
    }

    return text
  }
}
