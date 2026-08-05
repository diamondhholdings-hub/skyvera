/**
 * GET /api/export/accounts
 * Returns the full customer directory as a CSV download.
 * Same data already visible, unauthenticated, on /accounts — this endpoint
 * doesn't expose anything new, just a bulk export of it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import { rateLimit, rateLimitHeaders } from '@/lib/middleware/rate-limit'

function csvEscape(value: string | number): string {
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { limit: 10, window: 60_000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rl.reset },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  const result = await getAllCustomersWithHealth()
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  const columns = [
    'customer_name',
    'bu',
    'rr',
    'nrr',
    'total',
    'health_score',
    'rank',
    'pct_of_total',
  ] as const

  const rows = result.value.map((c) =>
    [
      c.customer_name,
      c.bu,
      c.rr,
      c.nrr,
      c.total,
      c.healthScore,
      c.rank ?? '',
      c.pct_of_total ?? '',
    ]
      .map(csvEscape)
      .join(',')
  )

  const csv = [columns.join(','), ...rows].join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="skyvera-accounts-${date}.csv"`,
    },
  })
}
