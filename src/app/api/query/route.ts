/**
 * Natural Language Query API endpoint
 * Handles NLQ requests and returns interpreted answers or clarification requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { nlqRequestSchema } from '@/lib/intelligence/nlq/types'
import { interpretQuery } from '@/lib/intelligence/nlq/interpreter'
import {
  getCannedQueryById,
  expandTemplate,
} from '@/lib/intelligence/nlq/canned-queries'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = nlqRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    const { query, filters, conversationContext, cannedQueryId } = validation.data

    // Determine the actual query to process
    let processedQuery = query

    // If this is a canned query, expand the template
    if (cannedQueryId) {
      const cannedQuery = getCannedQueryById(cannedQueryId)
      if (!cannedQuery) {
        return NextResponse.json(
          { error: `Canned query not found: ${cannedQueryId}` },
          { status: 404 }
        )
      }

      // Expand template with filters
      processedQuery = expandTemplate(cannedQuery.template, filters || {})
    }

    // Interpret the query using Claude
    const result = await interpretQuery(processedQuery, conversationContext)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Query interpretation failed',
          message: result.error.message,
        },
        { status: 500 }
      )
    }

    // Return successful response with timestamp
    return NextResponse.json(
      {
        query: processedQuery,
        response: result.value,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('NLQ API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
