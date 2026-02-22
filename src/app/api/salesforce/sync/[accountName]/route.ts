/**
 * POST /api/salesforce/sync/[accountName]
 * Syncs account data from Salesforce into local JSON files
 */
import { NextRequest, NextResponse } from 'next/server'
import { syncAccountFromSalesforce } from '@/lib/salesforce/sync'
import { revalidatePath } from 'next/cache'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ accountName: string }> }
) {
  const { accountName } = await params
  const decodedName = decodeURIComponent(accountName)

  try {
    const result = await syncAccountFromSalesforce(decodedName)

    // Revalidate the account plan page so fresh data shows
    revalidatePath(`/accounts/${accountName}`)

    return NextResponse.json({
      success: result.errors.length === 0,
      ...result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Check for missing credentials specifically
    if (message.includes('not configured')) {
      return NextResponse.json(
        { success: false, error: 'Salesforce not configured', message },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Sync failed', message },
      { status: 500 }
    )
  }
}
