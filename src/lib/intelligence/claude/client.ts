/**
 * Claude client factory: the single place that decides where Claude calls go.
 *
 * With TFY_API_KEY set, calls go through the TrueFoundry AI gateway, which
 * holds the provider keys. The gateway speaks the native Anthropic Messages
 * API, so the SDK, thinking blocks and streaming work unchanged; only the base
 * URL, the auth header and the model names (prefixed with the gateway's
 * provider group) differ. Without it, ANTHROPIC_API_KEY calls Anthropic
 * directly.
 */
import Anthropic from '@anthropic-ai/sdk'

const DEFAULT_TFY_BASE_URL = 'https://tfy.promptlens.trilogy.com'
const DEFAULT_TFY_MODEL_GROUP = 'claude-group'

/** True when Claude calls go through the TrueFoundry gateway. */
export function usesGateway(): boolean {
  return !!process.env.TFY_API_KEY
}

/** True when either the gateway or a direct Anthropic key is configured. */
export function isClaudeConfigured(): boolean {
  return usesGateway() || !!process.env.ANTHROPIC_API_KEY
}

/**
 * Model name as the configured backend expects it: the gateway names models
 * `<provider group>/<model>`, Anthropic takes the bare ID.
 */
export function resolveModel(modelId: string): string {
  if (!usesGateway()) return modelId
  const group = process.env.TFY_MODEL_GROUP || DEFAULT_TFY_MODEL_GROUP
  return `${group}/${modelId}`
}

/** A configured client, or null when no key is set (callers degrade gracefully). */
export function createClaudeClient(): Anthropic | null {
  const tfyKey = process.env.TFY_API_KEY
  if (tfyKey) {
    return new Anthropic({
      baseURL: process.env.TFY_BASE_URL || DEFAULT_TFY_BASE_URL,
      // The gateway expects a Bearer token; apiKey: null stops the SDK from
      // also sending an x-api-key header read from ANTHROPIC_API_KEY.
      apiKey: null,
      authToken: tfyKey,
    })
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  return apiKey ? new Anthropic({ apiKey }) : null
}
