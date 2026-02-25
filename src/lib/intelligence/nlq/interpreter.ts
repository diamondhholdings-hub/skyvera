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
 * Extract first valid JSON object from a string that may contain
 * markdown code fences, preamble text, or other wrapping.
 */
function extractJSON(text: string): unknown {
  // 1. Try direct parse first (pure JSON response)
  try { return JSON.parse(text.trim()) } catch {}

  // 2. Strip ```json ... ``` or ``` ... ``` fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()) } catch {}
  }

  // 3. Find the first { ... } block (largest match)
  const braceStart = text.indexOf('{')
  const braceEnd = text.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.slice(braceStart, braceEnd + 1)) } catch {}
  }

  throw new Error('No valid JSON found in response')
}

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
    // Strip markdown code fences if present (Claude sometimes wraps JSON)
    let parsedContent
    try {
      parsedContent = extractJSON(response.value.content)
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

    // Parse and validate response (strip markdown code fences if present)
    let parsedContent
    try {
      parsedContent = extractJSON(response.value.content)
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
