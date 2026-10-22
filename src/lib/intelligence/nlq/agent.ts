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
const MAX_ITERATIONS = 8

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
- Call several tools when a question spans areas (e.g. a customer's renewal and its receivables).
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
    const final = await client.beta.messages.toolRunner({
      model: REASONING_MODEL,
      // Thinking, tool calls and the JSON answer all count toward max_tokens.
      max_tokens: 12000,
      max_iterations: MAX_ITERATIONS,
      output_config: { effort: 'medium' },
      system: `${getAllMetricDefinitions()}\n${AGENT_GUIDANCE}`,
      tools: queryTools,
      messages: [{ role: 'user', content: buildNLQueryPrompt(query, DATA_SOURCES, conversationContext) }],
    })

    if (final.stop_reason === 'refusal') return err(new Error('Claude declined this request'))
    const text = extractText(final.content)
    if (!text.trim()) {
      return err(new Error(`No answer after ${MAX_ITERATIONS} tool calls (stop reason: ${final.stop_reason})`))
    }

    const validation = nlqResponseSchema.safeParse(extractJSON(text))
    if (!validation.success) {
      return err(new Error(`Invalid response format: ${validation.error.message}`))
    }
    cache.set(cacheKey, validation.data, { ttl: CACHE_TTL.CLAUDE_RESPONSE })
    return ok(validation.data)
  } catch (error) {
    return err(error instanceof Error ? error : new Error('Unknown error during query'))
  }
}
