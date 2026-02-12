/**
 * Notion Sync API Route
 * POST /api/notion/sync-account
 *
 * Syncs account data from Skyvera to Notion
 * Example usage of NotionAdapter in production API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getConnectorFactory } from '@/lib/data/registry/connector-factory'
import type { NotionAdapter } from '@/lib/data/adapters/external/notion'
import type { NotionAccountPlan } from '@/lib/types/notion'
import { z } from 'zod'

// Request body schema
const SyncAccountRequestSchema = z.object({
  accountName: z.string().min(1),
  businessUnit: z.enum(['Cloudsense', 'Kandy', 'STL']),
  healthScore: z.number().min(0).max(100),
  arr: z.number().min(0),
  status: z.enum(['active', 'at_risk', 'growth', 'maintenance']),
  churnRisk: z.enum(['low', 'medium', 'high']),
  executiveSummary: z.string(),
  strategicInitiatives: z.array(z.string()).optional(),
  keyContacts: z.array(z.object({
    name: z.string(),
    role: z.string(),
    email: z.string().email().optional(),
  })).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = SyncAccountRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const accountData = validation.data

    // Get Notion adapter
    const factory = await getConnectorFactory()
    const notion = factory.getAdapter('notion') as NotionAdapter

    if (!notion) {
      return NextResponse.json(
        { error: 'Notion adapter not available' },
        { status: 500 }
      )
    }

    // Check if Notion is configured
    const status = notion.getStatus()
    if (status.degraded) {
      return NextResponse.json(
        {
          error: 'Notion not configured',
          message: 'NOTION_API_KEY not set in environment variables',
        },
        { status: 503 }
      )
    }

    // Build account plan
    const accountPlan: NotionAccountPlan = {
      accountName: accountData.accountName,
      businessUnit: accountData.businessUnit,
      accountStatus: accountData.status,
      healthScore: accountData.healthScore,
      arr: accountData.arr,
      executiveSummary: accountData.executiveSummary,
      strategicInitiatives: accountData.strategicInitiatives || [],
      keyContacts: accountData.keyContacts || [],
      churnRisk: accountData.churnRisk,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'api',
    }

    // Check if account plan already exists in Notion
    const existingPlan = await notion.readAccountPlan(accountData.accountName)

    if (existingPlan.success && existingPlan.value) {
      // Update existing plan
      accountPlan.id = existingPlan.value.id
    }

    // Write to Notion
    const writeResult = await notion.writeAccountPlan(accountPlan)

    if (!writeResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to sync to Notion',
          message: writeResult.error.message,
        },
        { status: 500 }
      )
    }

    // Success
    return NextResponse.json({
      success: true,
      accountName: accountData.accountName,
      notionPageId: writeResult.value,
      action: existingPlan.success && existingPlan.value ? 'updated' : 'created',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Notion Sync API] Error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notion/sync-account?accountName=Telstra
 * Read account plan from Notion
 */
export async function GET(request: NextRequest) {
  try {
    // Get account name from query params
    const { searchParams } = new URL(request.url)
    const accountName = searchParams.get('accountName')

    if (!accountName) {
      return NextResponse.json(
        { error: 'accountName query parameter required' },
        { status: 400 }
      )
    }

    // Get Notion adapter
    const factory = await getConnectorFactory()
    const notion = factory.getAdapter('notion') as NotionAdapter

    if (!notion) {
      return NextResponse.json(
        { error: 'Notion adapter not available' },
        { status: 500 }
      )
    }

    // Check if Notion is configured
    const status = notion.getStatus()
    if (status.degraded) {
      return NextResponse.json(
        {
          error: 'Notion not configured',
          message: 'NOTION_API_KEY not set in environment variables',
        },
        { status: 503 }
      )
    }

    // Read from Notion
    const readResult = await notion.readAccountPlan(accountName)

    if (!readResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to read from Notion',
          message: readResult.error.message,
        },
        { status: 500 }
      )
    }

    if (!readResult.value) {
      return NextResponse.json(
        {
          error: 'Account plan not found',
          accountName,
        },
        { status: 404 }
      )
    }

    // Success
    return NextResponse.json({
      success: true,
      accountPlan: readResult.value,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Notion Sync API] Error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Example Usage:
 *
 * POST /api/notion/sync-account
 * {
 *   "accountName": "Telstra",
 *   "businessUnit": "Cloudsense",
 *   "healthScore": 85,
 *   "arr": 6500000,
 *   "status": "active",
 *   "churnRisk": "low",
 *   "executiveSummary": "Telstra is our largest Cloudsense customer...",
 *   "strategicInitiatives": ["Expand usage", "Migrate to cloud"],
 *   "keyContacts": [
 *     {
 *       "name": "John Smith",
 *       "role": "CTO",
 *       "email": "john.smith@telstra.com"
 *     }
 *   ]
 * }
 *
 * GET /api/notion/sync-account?accountName=Telstra
 */
