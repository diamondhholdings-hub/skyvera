/**
 * Unit tests for account plan completeness scoring
 * Real content counts; missing files and untouched demo templates do not
 */

import { describe, it, expect } from 'vitest'
import { hasRealPlanContent, getCompletenessScores } from '../../src/lib/data/server/account-plan-data'

describe('hasRealPlanContent', () => {
  it('rejects missing and empty sections', () => {
    expect(hasRealPlanContent('stakeholders', null)).toBe(false)
    expect(hasRealPlanContent('stakeholders', [])).toBe(false)
    expect(hasRealPlanContent('actions', [])).toBe(false)
    expect(hasRealPlanContent('strategy', { painPoints: [], opportunities: [] })).toBe(false)
    expect(hasRealPlanContent('intelligence', { raw: '  ' })).toBe(false)
  })

  it('rejects the generate-demo-data templates', () => {
    expect(hasRealPlanContent('stakeholders', [{ name: 'Chief Technology Officer' }])).toBe(false)
    expect(hasRealPlanContent('strategy', { painPoints: [{ title: 'Legacy system modernization needs' }] })).toBe(false)
    expect(hasRealPlanContent('competitors', [
      { description: 'Amdocs competes with Skyvera for BSS/OSS platform business.' },
    ])).toBe(false)
  })

  it('accepts account-specific content', () => {
    expect(hasRealPlanContent('stakeholders', [{ name: 'Patricia Cobian' }])).toBe(true)
    expect(hasRealPlanContent('strategy', { painPoints: [{ title: 'SME acquisition costs rising' }] })).toBe(true)
    expect(hasRealPlanContent('actions', [{ title: 'Schedule QBR' }])).toBe(true)
    expect(hasRealPlanContent('competitors', [{ description: 'Native Salesforce CPQ' }])).toBe(true)
    expect(hasRealPlanContent('intelligence', { raw: '# Report' })).toBe(true)
  })
})

describe('getCompletenessScores', () => {
  it('reads data/account-plans and scores a fully researched account at 100', async () => {
    const scores = await getCompletenessScores(['Telefonica UK Limited', 'No Such Account'])
    expect(scores['Telefonica UK Limited']).toBe(100)
    expect(scores['No Such Account']).toBe(0)
  })
})
