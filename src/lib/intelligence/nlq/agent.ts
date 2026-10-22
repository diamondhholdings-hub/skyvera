/**
 * Natural language query agent: Claude answers business questions by calling
 * data tools (see ./tools.ts) over the budget snapshots, then returns the
 * same NLQResponse JSON the Ask page already renders.
 */
import { createClaudeClient } from '@/lib/intelligence/claude/client'
import { REASONING_MODEL, extractText } from '@/lib/intelligence/claude/models'
import { buildNLQueryPrompt } from '@/lib/intelligence/claude/prompts/nl-query'
import { getAllMetricDefinitions } from '@/lib/semantic/schema/financial'
import { getCacheManager, CACHE_TTL } from '@/lib/cache/manager'
import { Result, ok, err } from '@/lib/types/result'
import { NLQResponse, nlqResponseSchema } from './types'
import { extractJSON } from './interpreter'
import { queryTools } from './tools'

/** Tool calls allowed per question before the agent must answer. */
const MAX_ITERATIONS = 10

const DATA_SOURCES = [
  'Company and business unit P&L, margin targets and retention (get_company_overview)',
  'P&L by product line for the current and next three quarters (get_product_pnl)',
  'Consolidated income statement history and budget by quarter (get_financial_history)',
  'Customers: revenue, subscriptions, renewals, receivables, Salesforce opportunities (get_customer)',
  'Renewals by quarter and at-risk subscriptions (get_renewals)',
  'Salesforce renewal pipeline by stage and owner (get_pipeline)',
  'Receivables over 90 days with collection notes (get_receivables)',
  'Non-recurring revenue by customer and class (get_nonrecurring_revenue)',
  'Vendor costs by vendor, BU and expense nature (get_vendors)',
  'Central-function charges by service and BU (get_central_functions)',
  'Headcount and people cost, aggregated (get_headcount)',
  'AI tooling cost vs a year earlier (get_ai_cost)',
  'Cost structure vs the internal cost model (get_cost_benchmark)',
]

const AGENT_GUIDANCE = `
You answer questions from Skyvera's executive about the business, using the data tools.
- Always fetch figures with the tools before answering; never invent or estimate numbers the tools didn't return.
- "This quarter", "current" or no period means the current quarter in the data; don't ask which quarter.
- Call several tools when a question spans areas (e.g. a customer's renewal and its receivables), all in the same turn when they don't depend on each other. You have at most ${MAX_ITERATIONS} turns.
- Customer annual RR/NRR and subscription ARR are already annual. BU P&L figures are quarterly.
- Headcount data is aggregated; never speculate about individuals.
- If the tools don't hold what's asked, say exactly what is missing.
- Finish with the JSON object described in the request, and nothing after it.`

/**
 * Answer a query with tool use. Successful answers are cached briefly, keyed
 * on the query and conversation context.
 */
export async function answerQueryWithTools(
  query: string,
  conversationContext?: string
): Promise<Result<NLQResponse>> {
  const client = createClaudeClient()
  if (!client) return err(new Error('Claude API not configured'))

  const cache = getCacheManager()
  const cacheKey = `nlq-agent:${query}\n${conversationContext ?? ''}`
  const cached = cache.getWithMetadata<NLQResponse>(cacheKey)
  if (cached) return ok(cached.value)

  try {
    const request = {
      model: REASONING_MODEL,
      // Thinking, tool calls and the JSON answer all count toward max_tokens.
      max_tokens: 12000,
      output_config: { effort: 'medium' as const },
      system: `${getAllMetricDefinitions()}\n${AGENT_GUIDANCE}`,
    }
    const runner = client.beta.messages.toolRunner({
      ...request,
      max_iterations: MAX_ITERATIONS,
      tools: queryTools,
      messages: [{ role: 'user', content: buildNLQueryPrompt(query, DATA_SOURCES, conversationContext) }],
    })
    let final = await runner.runUntilDone()
    if (final.stop_reason === 'refusal') return err(new Error('Claude declined this request'))

    let parsed = parseAnswer(extractText(final.content))
    if (!parsed.success) {
      // Out of tool calls, or the answer wasn't the JSON object: one more turn
      // with tools disabled, answering from what the tools already returned.
      const messages = [...runner.params.messages]
      messages.push({
        role: 'user',
        content:
          messages.at(-1)?.role === 'assistant'
            ? 'Rewrite your answer as the JSON object described in the request, and nothing else.'
            : 'You are out of tool calls. Answer now from the data you have, as the JSON object described in the request, and nothing else.',
      })
      final = await client.beta.messages.create({
        ...request,
        // The history holds tool calls, so the tools must still be declared
        tools: queryTools.map(({ run: _run, parse: _parse, ...definition }) => definition),
        tool_choice: { type: 'none' },
        messages,
      })
      parsed = parseAnswer(extractText(final.content))
    }
    if (!parsed.success) return err(new Error(`Invalid response format: ${parsed.error}`))
    cache.set(cacheKey, parsed.data, { ttl: CACHE_TTL.CLAUDE_RESPONSE })
    return ok(parsed.data)
  } catch (error) {
    return err(error instanceof Error ? error : new Error('Unknown error during query'))
  }
}

/** Validate Claude's final text as an NLQResponse. */
function parseAnswer(text: string): { success: true; data: NLQResponse } | { success: false; error: string } {
  if (!text.trim()) return { success: false, error: 'empty answer' }
  let json: unknown
  try {
    json = extractJSON(text)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'no JSON' }
  }
  const validation = nlqResponseSchema.safeParse(json)
  return validation.success
    ? { success: true, data: validation.data }
    : { success: false, error: validation.error.message }
}
