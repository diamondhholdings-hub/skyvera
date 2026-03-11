/**
 * PATCH /api/account-plan/[name]/actions/[id]
 * Update an action item's status in the account plan JSON file.
 * Body: { status: 'todo' | 'in-progress' | 'done' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { slugifyCustomerName } from '@/lib/data/server/account-plan-data'
import { ActionItemSchema, ActionStatusSchema } from '@/lib/types/account-plan'
import { z } from 'zod'

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
    const statusResult = ActionStatusSchema.safeParse(bodyObj?.status)
    if (!statusResult.success) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: todo, in-progress, done' },
        { status: 400 }
      )
    }
    const newStatus = statusResult.data

    // Load the actions JSON file
    const slug = slugifyCustomerName(customerName)
    const filePath = path.join(process.cwd(), `data/account-plans/actions/${slug}.json`)

    let rawContent: string
    try {
      rawContent = await readFile(filePath, 'utf-8')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ error: 'Account actions file not found' }, { status: 404 })
      }
      throw err
    }

    const actions = z.array(ActionItemSchema).parse(JSON.parse(rawContent))

    // Find the action item by ID
    const actionIndex = actions.findIndex((a) => a.id === id)
    if (actionIndex === -1) {
      return NextResponse.json({ error: `Action item '${id}' not found` }, { status: 404 })
    }

    // Update the status
    actions[actionIndex] = {
      ...actions[actionIndex],
      status: newStatus,
    }

    // Write back to disk
    await writeFile(filePath, JSON.stringify(actions, null, 2), 'utf-8')

    return NextResponse.json({ action: actions[actionIndex] }, { status: 200 })
  } catch (error) {
    console.error('[PATCH actions] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
