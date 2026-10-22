/**
 * Unit tests for the Claude client factory: gateway vs direct routing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClaudeClient, resolveModel, isClaudeConfigured } from '../../src/lib/intelligence/claude/client'

const KEYS = ['TFY_API_KEY', 'TFY_BASE_URL', 'TFY_MODEL_GROUP', 'ANTHROPIC_API_KEY'] as const
let saved: Partial<Record<(typeof KEYS)[number], string>>

beforeEach(() => {
  saved = {}
  for (const k of KEYS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe('Claude client factory', () => {
  it('returns null with no key configured', () => {
    expect(isClaudeConfigured()).toBe(false)
    expect(createClaudeClient()).toBeNull()
  })

  it('routes through the gateway with a Bearer token and no x-api-key', () => {
    process.env.TFY_API_KEY = 'tfy-key'
    process.env.ANTHROPIC_API_KEY = 'direct-key'
    const client = createClaudeClient()!
    expect(client.baseURL).toBe('https://tfy.promptlens.trilogy.com')
    expect(client.authToken).toBe('tfy-key')
    expect(client.apiKey).toBeNull()
  })

  it('prefixes model names with the gateway provider group', () => {
    process.env.TFY_API_KEY = 'tfy-key'
    expect(resolveModel('claude-haiku-5-5')).toBe('claude-group/claude-haiku-5-5')
    process.env.TFY_MODEL_GROUP = 'other-group'
    expect(resolveModel('claude-haiku-5-5')).toBe('other-group/claude-haiku-5-5')
  })

  it('falls back to Anthropic directly with bare model names', () => {
    process.env.ANTHROPIC_API_KEY = 'direct-key'
    const client = createClaudeClient()!
    expect(client.apiKey).toBe('direct-key')
    expect(client.baseURL).toBe('https://api.anthropic.com')
    expect(resolveModel('claude-haiku-5-5')).toBe('claude-haiku-5-5')
  })
})
