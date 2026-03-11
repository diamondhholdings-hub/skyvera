/**
 * PATCH /api/account-plan/[name]/pain-points/[id]
 * Update a pain point's status in the account plan JSON file.
 * Body: { status: 'active' | 'monitoring' | 'resolved' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { slugifyCustomerName } from '@/lib/data/server/account-plan-data'
import { StrategyDataSchema, PainPointStatusSchema } from '@/lib/types/account-plan'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; id: string }> }
) {
  try {
    const { name, id } = await params
    const customerName = decodeURIComponent(name).replace(/\+/g, ' ')

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const bodyObj = body as Record<string, unknown>
    const statusResult = PainPointStatusSchema.safeParse(bodyObj?.status)
    if (!statusResult.success) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: active, monitoring, resolved' },
        { status: 400 }
      )
    }
    const newStatus = statusResult.data

    // Load the strategy JSON file
    const slug = slugifyCustomerName(customerName)
    const filePath = path.join(process.cwd(), `data/account-plans/strategy/${slug}.json`)

    let rawContent: string
    try {
      rawContent = await readFile(filePath, 'utf-8')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ error: 'Account strategy file not found' }, { status: 404 })
      }
      throw err
    }

    const strategyData = StrategyDataSchema.parse(JSON.parse(rawContent))

    // Find the pain point by ID
    const ppIndex = strategyData.painPoints.findIndex((pp) => pp.id === id)
    if (ppIndex === -1) {
      return NextResponse.json({ error: `Pain point '${id}' not found` }, { status: 404 })
    }

    // Update the status
    strategyData.painPoints[ppIndex] = {
      ...strategyData.painPoints[ppIndex],
      status: newStatus,
    }

    // Write back to disk
    await writeFile(filePath, JSON.stringify(strategyData, null, 2), 'utf-8')

    return NextResponse.json({ painPoint: strategyData.painPoints[ppIndex] }, { status: 200 })
  } catch (error) {
    console.error('[PATCH pain-points] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
