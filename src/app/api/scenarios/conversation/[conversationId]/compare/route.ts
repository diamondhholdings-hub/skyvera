/**
 * POST /api/scenarios/conversation/[conversationId]/compare
 * Compare multiple versions of a scenario
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getConversationManager, type ScenarioVersionData } from '@/lib/intelligence/scenarios/conversation-manager'
import { prisma } from '@/lib/db/prisma'

const compareSchema = z.object({
  versionNumbers: z.array(z.number()).min(2, 'Must compare at least 2 versions'),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    // Parse request
    const body = await request.json()
    const validation = compareSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { versionNumbers } = validation.data

    // Get conversation with specified versions
    const conversation = await prisma.scenarioConversation.findUnique({
      where: { conversationId },
      include: {
        versions: {
          where: {
            versionNumber: {
              in: versionNumbers,
            },
          },
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

    if (conversation.versions.length < 2) {
      return NextResponse.json(
        {
          error: 'Not enough versions to compare',
        },
        { status: 400 }
      )
    }

    // Convert to ScenarioVersionData
    const versions: ScenarioVersionData[] = conversation.versions.map((v) => ({
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
    }))

    // Get comparison analysis
    const manager = getConversationManager()
    const result = await manager.compareVersions(versions)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to compare versions',
          details: result.error.message,
        },
        { status: 500 }
      )
    }

    const comparison = result.value

    // Add comparison message to conversation
    await prisma.scenarioMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: `Comparison of versions ${versionNumbers.join(', ')}:\n\n${formatComparison(comparison)}`,
        messageType: 'analysis',
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
      comparison,
      versions,
    })
  } catch (error) {
    console.error('[POST /api/scenarios/conversation/[conversationId]/compare] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }

  function formatComparison(comparison: any): string {
    let text = ''

    if (comparison.recommendation) {
      text += `**Recommendation:** Version ${comparison.recommendation.preferredVersion}\n`
      text += `${comparison.recommendation.reasoning}\n\n`
    }

    if (comparison.keyDifferences && comparison.keyDifferences.length > 0) {
      text += '**Key Differences:**\n'
      comparison.keyDifferences.forEach((diff: any) => {
        text += `- ${diff.metric}: ${diff.significance}\n`
      })
      text += '\n'
    }

    if (comparison.tradeoffs) {
      text += '**Trade-offs:**\n'
      Object.entries(comparison.tradeoffs).forEach(([version, tradeoff]) => {
        text += `- ${version}: ${tradeoff}\n`
      })
    }

    return text
  }
}
