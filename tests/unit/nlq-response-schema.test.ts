/**
 * The NLQ response schema accepts the nulls Claude writes for empty fields
 */
import { describe, it, expect } from 'vitest'
import { nlqResponseSchema } from '../../src/lib/intelligence/nlq/types'

const base = {
  interpretation: 'Vendor costs this quarter',
  answer: 'Salesforce is the largest vendor.',
  needsClarification: false,
  sources: ['Vendor Input'],
  confidence: 'HIGH',
}

describe('nlqResponseSchema', () => {
  it('treats null optional fields as missing', () => {
    const parsed = nlqResponseSchema.parse({
      ...base,
      clarificationQuestion: null,
      clarificationOptions: null,
      suggestedFollowUps: null,
    })
    expect(parsed.clarificationQuestion).toBeUndefined()
    expect(parsed.suggestedFollowUps).toBeUndefined()
  })

  it('drops null data points and keeps the rest', () => {
    const parsed = nlqResponseSchema.parse({ ...base, dataPoints: { headcount: null, cost: 1_044_762 } })
    expect(parsed.dataPoints).toEqual({ cost: 1_044_762 })
  })

  it('still rejects a missing required field', () => {
    const { sources: _sources, ...noSources } = base
    expect(nlqResponseSchema.safeParse(noSources).success).toBe(false)
  })
})
