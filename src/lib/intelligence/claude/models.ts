/**
 * Claude model IDs — the single place to change which models the platform calls.
 *
 * Both current-generation models run adaptive thinking by default and reject
 * non-default `temperature`/`top_p`/`top_k` with a 400, so callers must not send
 * sampling parameters and must read response content blocks by `type` (a
 * response can begin with `thinking` blocks). Use `extractText()` for that.
 */
import type Anthropic from '@anthropic-ai/sdk'
import { resolveModel } from './client'

/**
 * Fast, low-cost model for high-volume orchestrator work (NLQ, scenarios, DM recommendations).
 * Through the TrueFoundry gateway this becomes `claude-group/claude-haiku-5-5`.
 */
export const FAST_MODEL = resolveModel('claude-haiku-5-5')

/** Higher-reasoning model for interactive account chat and PRD generation. */
export const REASONING_MODEL = resolveModel('claude-sonnet-5-5')

/**
 * Beta header + param for server-side refusal fallback on REASONING_MODEL.
 * Claude Haiku 5.5 has no server-side fallback, so this is not used on FAST_MODEL.
 */
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01'

/** Concatenate every text block in a response, skipping thinking blocks. */
export function extractText(content: ReadonlyArray<{ type: string }>): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
}
