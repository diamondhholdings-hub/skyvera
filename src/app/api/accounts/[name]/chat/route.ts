/**
 * Per-account AI chat API endpoint
 * POST /api/accounts/[name]/chat
 * Streams a Claude response using account context as system prompt
 */

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAccountPlanData } from '@/lib/data/server/account-plan-data'
import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import { rateLimit, rateLimitHeaders } from '@/lib/middleware/rate-limit'
import { chatMessageSchema } from '@/lib/validation/schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  // Rate limit: 20 requests per minute (streaming chat)
  const rl = rateLimit(request, { limit: 20, window: 60_000 })
  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: 'Too many requests', retryAfter: rl.reset }),
      { status: 429, headers: { 'Content-Type': 'application/json', ...rateLimitHeaders(rl) } }
    )
  }

  try {
    const { name } = await params
    const customerName = decodeURIComponent(name).replace(/\+/g, ' ')

    // Parse and validate request body
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const validation = chatMessageSchema.safeParse(rawBody)
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.issues,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { message, history } = validation.data

    // Fetch account plan data in parallel with customer data
    const [accountDataResult, customersResult] = await Promise.all([
      getAccountPlanData(customerName),
      getAllCustomersWithHealth(),
    ])

    // Find the specific customer (case-insensitive)
    const normalizedName = customerName.toLowerCase().trim()
    const customer = customersResult.success
      ? customersResult.value.find(
          (c) => c.customer_name.toLowerCase().trim() === normalizedName
        )
      : null

    // Build account context for system prompt
    const arr = customer ? (customer.rr || 0) + (customer.nrr || 0) : 0
    const arrFormatted =
      arr >= 1_000_000
        ? `$${(arr / 1_000_000).toFixed(1)}M`
        : arr >= 1_000
          ? `$${(arr / 1000).toFixed(0)}K`
          : `$${arr}`

    const bu = customer?.bu ?? 'Unknown'
    const healthScore = customer?.healthScore ?? 'unknown'
    const healthFactors = customer?.healthFactors ?? []

    const accountData = accountDataResult.success ? accountDataResult.value : null
    const painPoints = accountData?.strategy?.painPoints ?? []
    const opportunities = accountData?.strategy?.opportunities ?? []
    const stakeholders = accountData?.stakeholders ?? []
    const competitors = accountData?.competitors ?? []
    const actions = accountData?.actions ?? []

    const systemPrompt = `You are an AI account strategist for Skyvera, a SaaS company. You have deep knowledge of the following account and help sales teams prepare for meetings, understand risks, and identify opportunities.

ACCOUNT: ${customerName}
BUSINESS UNIT: ${bu}
ANNUAL REVENUE: ${arrFormatted}
HEALTH SCORE: ${healthScore}
HEALTH FACTORS: ${healthFactors.length > 0 ? healthFactors.join(', ') : 'None recorded'}

PAIN POINTS:
${painPoints.length > 0 ? painPoints.map((p) => `- ${p.title}: ${p.description}`).join('\n') : '- No pain points recorded'}

OPPORTUNITIES:
${opportunities.length > 0 ? opportunities.map((o) => `- ${o.title}: ${o.description}`).join('\n') : '- No opportunities recorded'}

KEY STAKEHOLDERS:
${stakeholders.length > 0 ? stakeholders.map((s) => `- ${s.name} (${s.title}), ${s.role}, relationship: ${s.relationshipStrength}`).join('\n') : '- No stakeholders recorded'}

COMPETITORS:
${competitors.length > 0 ? competitors.map((c) => `- ${c.name}: ${c.description}`).join('\n') : '- No competitors recorded'}

RECENT ACTIONS:
${actions.length > 0 ? actions.slice(0, 5).map((a) => `- ${a.title}${a.description ? ': ' + a.description : ''}`).join('\n') : '- No recent actions recorded'}

Answer questions concisely and strategically. Focus on actionable insights.`

    // Build messages array for Anthropic API
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...(history || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messageStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemPrompt,
            messages,
          })

          for await (const chunk of messageStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text
              controller.enqueue(new TextEncoder().encode(text))
            }
          }

          controller.close()
        } catch (error) {
          console.error('[chat/route] Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('[chat/route] Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
