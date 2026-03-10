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
          customerName: customerName.trim(),
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
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const customerName =
    body && typeof body === 'object' && 'customerName' in body
      ? (body as { customerName: unknown }).customerName
      : undefined

  if (typeof customerName !== 'string' || !customerName.trim()) {
    return NextResponse.json(
      { error: 'Missing or invalid field: customerName (string required)' },
      { status: 400 }
    )
  }

  try {
    const result = await enrichAccount(customerName.trim())

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, customerName: customerName.trim() },
        { status: 500 }
      )
    }

    return NextResponse.json(result.value, { status: 200 })
  } catch (error) {
    console.error('[POST /api/enrich] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error during enrichment',
        customerName: customerName.trim(),
      },
      { status: 500 }
    )
  }
}
