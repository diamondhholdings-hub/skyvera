/**
 * Enrichment API — on-demand RapidAPI enrichment for accounts
 *
 * POST /api/enrich
 *   Body: { "customerName": "British Telecommunications" }
 *   Runs enrichAccount() and returns the AccountEnrichment JSON.
 *
 * GET /api/enrich?customerName=British+Telecommunications
 *   Returns cached enrichment from data/enrichment/{slug}.json
 *   or 404 if the account has not been enriched yet.
 */

import { NextRequest, NextResponse } from 'next/server'
import { enrichAccount, getEnrichmentCache } from '@/lib/data/server/enrichment-pipeline'
import { rateLimit, rateLimitHeaders } from '@/lib/middleware/rate-limit'
import { enrichRequestSchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const customerName = searchParams.get('customerName')

  if (!customerName || !customerName.trim()) {
    return NextResponse.json(
      { error: 'Missing required query parameter: customerName' },
      { status: 400 }
    )
  }

  try {
    const cached = await getEnrichmentCache(customerName.trim())

    if (!cached) {
      return NextResponse.json(
        {
          error: 'Enrichment not found. Use POST /api/enrich to trigger enrichment.',
          customerName,
        },
        { status: 404 }
      )
    }

    return NextResponse.json(cached, { status: 200 })
  } catch (error) {
    console.error('[GET /api/enrich] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error reading enrichment cache',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per minute (expensive external API calls)
  const rl = rateLimit(request, { limit: 5, window: 60_000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rl.reset },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = enrichRequestSchema.safeParse(rawBody)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.issues },
      { status: 400 }
    )
  }

  const customerName = validation.data.customerName.trim()

  try {
    const result = await enrichAccount(customerName)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, customerName },
        { status: 500 }
      )
    }

    return NextResponse.json(result.value, { status: 200 })
  } catch (error) {
    console.error('[POST /api/enrich] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error during enrichment',
        customerName,
      },
      { status: 500 }
    )
  }
}
