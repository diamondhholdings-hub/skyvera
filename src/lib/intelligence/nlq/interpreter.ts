/**
 * Natural Language Query Interpreter
 * Uses Claude AI to interpret and answer business intelligence queries
 */

import { getOrchestrator } from '@/lib/intelligence/claude/orchestrator'
import { buildNLQueryPrompt } from '@/lib/intelligence/claude/prompts/nl-query'
import { getAllMetricDefinitions } from '@/lib/semantic/schema/financial'
import { Result, ok, err } from '@/lib/types/result'
import { NLQResponse, nlqResponseSchema } from './types'

/**
 * Available data sources in the Skyvera system
 */
const AVAILABLE_DATA_SOURCES = [
  'P&L data for Cloudsense, Kandy, STL business units',
  'Recurring Revenue (RR) by customer and business unit',
  'Non-Recurring Revenue (NRR) by business unit',
  'Customer health scores for 140 active customers',
  'Vendor costs and contract data',
  'Headcount and salary budget data',
  'Accounts Receivable aging analysis',
  'Margin targets by business unit',
]

/**
 * Interpret a natural language query and generate an answer
 */
export async function interpretQuery(
  query: string,
  conversationContext?: string
): Promise<Result<NLQResponse>> {
  try {
    // Get Claude orchestrator
    const orchestrator = getOrchestrator()

    // Build prompt with available data sources
    const prompt = buildNLQueryPrompt(query, AVAILABLE_DATA_SOURCES, conversationContext)

    // Get metric definitions as system context
    const systemPrompt = getAllMetricDefinitions()

    // Call Claude via orchestrator
    const response = await orchestrator.processRequest({
      prompt,
      systemPrompt,
      priority: 'HIGH',
      maxTokens: 2048,
      temperature: 0.5,
    })

    // Handle orchestrator errors (e.g., no API key)
    if (!response.success) {
      // Return mock response for graceful degradation
      return ok({
        interpretation: query,
        answer:
          'Claude AI is not configured. Please set ANTHROPIC_API_KEY in your environment to enable natural language queries.',
        needsClarification: false,
        sources: [],
        confidence: 'LOW',
        dataPoints: {},
      })
    }

    // Parse and validate Claude's JSON response
    let parsedContent
    try {
      parsedContent = JSON.parse(response.value.content)
    } catch (parseError) {
      return err(new Error('Failed to parse Claude response as JSON'))
    }

    const validation = nlqResponseSchema.safeParse(parsedContent)
    if (!validation.success) {
      return err(
        new Error(`Invalid response format: ${validation.error.message}`)
      )
    }

    return ok(validation.data)
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error('Unknown error during query interpretation')
    )
  }
}

/**
 * Interpret query with additional data context
 * Enriches the prompt with specific data values for more accurate answers
 */
export async function interpretQueryWithData(
  query: string,
  contextData: Record<string, unknown>,
  conversationContext?: string
): Promise<Result<NLQResponse>> {
  try {
    // Get Claude orchestrator
    const orchestrator = getOrchestrator()

    // Build base prompt
    const basePrompt = buildNLQueryPrompt(
      query,
      AVAILABLE_DATA_SOURCES,
      conversationContext
    )

    // Prepend data context to prompt
    const dataContext = `
RELEVANT DATA CONTEXT:
${JSON.stringify(contextData, null, 2)}

Use the data above to provide specific, accurate answers to the user's query.
`
    const enrichedPrompt = dataContext + '\n\n' + basePrompt

    // Get metric definitions as system context
    const systemPrompt = getAllMetricDefinitions()

    // Call Claude via orchestrator
    const response = await orchestrator.processRequest({
      prompt: enrichedPrompt,
      systemPrompt,
      priority: 'HIGH',
      maxTokens: 2048,
      temperature: 0.5,
    })

    // Handle orchestrator errors
    if (!response.success) {
      return ok({
        interpretation: query,
        answer:
          'Claude AI is not configured. Please set ANTHROPIC_API_KEY in your environment to enable natural language queries.',
        needsClarification: false,
        sources: [],
        confidence: 'LOW',
        dataPoints: {},
      })
    }

    // Parse and validate response
    let parsedContent
    try {
      parsedContent = JSON.parse(response.value.content)
    } catch (parseError) {
      return err(new Error('Failed to parse Claude response as JSON'))
    }

    const validation = nlqResponseSchema.safeParse(parsedContent)
    if (!validation.success) {
      return err(
        new Error(`Invalid response format: ${validation.error.message}`)
      )
    }

    return ok(validation.data)
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error('Unknown error during query interpretation')
    )
  }
}
