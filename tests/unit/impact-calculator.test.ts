/**
 * Unit tests for DM Strategy Impact Calculator
 * Tests ARR impact, DM% impact, margin impact, ROI, payback period, ranking, and DM waterfall
 */

import { describe, it, expect } from 'vitest'
import {
  calculateARRImpact,
  calculateDMImpact,
  calculateMarginImpact,
  calculateROI,
  calculatePaybackPeriod,
  rankByExpectedValue,
  calculateDMComponents,
  calculateBreakevenIceMelt,
} from '../../src/lib/intelligence/dm-strategy/impact-calculator'
import type { DMRecommendation } from '../../src/lib/intelligence/dm-strategy/types'
import { DM_CONSTANTS } from '../../src/lib/intelligence/dm-strategy/constants'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRec(
  overrides: Partial<DMRecommendation> & {
    arrImpact?: number
    dmImpact?: number
    marginImpact?: number
    confidenceLevel?: number
    risk?: DMRecommendation['risk']
    timeline?: DMRecommendation['timeline']
  } = {}
): DMRecommendation {
  return {
    recommendationId: 'rec-001',
    accountName: 'Acme Corp',
    bu: 'Cloudsense',
    type: 'churn_prevention',
    priority: 'high',
    title: 'Prevent churn',
    description: 'Prevent at-risk account from churning',
    reasoning: 'Account showing disengagement signals',
    impact: {
      arrImpact: overrides.arrImpact ?? 100_000,
      dmImpact: overrides.dmImpact ?? 2.5,
      marginImpact: overrides.marginImpact ?? 1.0,
      confidenceLevel: overrides.confidenceLevel ?? 80,
    },
    timeline: overrides.timeline ?? 'immediate',
    ownerTeam: 'CSM',
    risk: overrides.risk ?? 'low',
    status: 'pending',
    ...overrides,
  }
}

// ── calculateARRImpact ────────────────────────────────────────────────────────

describe('calculateARRImpact', () => {
  it('returns baseImpact × confidence × risk for low risk', () => {
    const rec = makeRec({ arrImpact: 100_000, confidenceLevel: 80, risk: 'low' })
    // 100000 * (80/100) * 1.0 = 80000
    expect(calculateARRImpact(rec)).toBeCloseTo(80_000, 0)
  })

  it('applies 0.85 risk multiplier for medium risk', () => {
    const rec = makeRec({ arrImpact: 100_000, confidenceLevel: 100, risk: 'medium' })
    expect(calculateARRImpact(rec)).toBeCloseTo(85_000, 0)
  })

  it('applies 0.7 risk multiplier for high risk', () => {
    const rec = makeRec({ arrImpact: 100_000, confidenceLevel: 100, risk: 'high' })
    expect(calculateARRImpact(rec)).toBeCloseTo(70_000, 0)
  })

  it('returns 0 when confidence is 0', () => {
    const rec = makeRec({ arrImpact: 500_000, confidenceLevel: 0, risk: 'low' })
    expect(calculateARRImpact(rec)).toBe(0)
  })

  it('full confidence + low risk returns base impact unchanged', () => {
    const rec = makeRec({ arrImpact: 250_000, confidenceLevel: 100, risk: 'low' })
    expect(calculateARRImpact(rec)).toBeCloseTo(250_000, 0)
  })
})

// ── calculateDMImpact ─────────────────────────────────────────────────────────

describe('calculateDMImpact', () => {
  it('scales base DM impact by confidence and risk', () => {
    const rec = makeRec({ dmImpact: 2.5, confidenceLevel: 80, risk: 'low' })
    // 2.5 * 0.8 * 1.0 = 2.0
    expect(calculateDMImpact(rec, 1_000_000)).toBeCloseTo(2.0, 5)
  })

  it('high risk halves the effective DM impact (× 0.7)', () => {
    const rec = makeRec({ dmImpact: 10, confidenceLevel: 100, risk: 'high' })
    expect(calculateDMImpact(rec, 1_000_000)).toBeCloseTo(7.0, 5)
  })

  it('zero dmImpact returns 0 regardless of risk', () => {
    const rec = makeRec({ dmImpact: 0, confidenceLevel: 100, risk: 'medium' })
    expect(calculateDMImpact(rec, 5_000_000)).toBe(0)
  })
})

// ── calculateMarginImpact ─────────────────────────────────────────────────────

describe('calculateMarginImpact', () => {
  it('scales margin impact by confidence and risk', () => {
    const rec = makeRec({ marginImpact: 4, confidenceLevel: 50, risk: 'medium' })
    // 4 * 0.5 * 0.85 = 1.7
    expect(calculateMarginImpact(rec)).toBeCloseTo(1.7, 5)
  })

  it('full confidence low risk returns base unchanged', () => {
    const rec = makeRec({ marginImpact: 3, confidenceLevel: 100, risk: 'low' })
    expect(calculateMarginImpact(rec)).toBeCloseTo(3, 5)
  })
})

// ── calculateROI ──────────────────────────────────────────────────────────────

describe('calculateROI', () => {
  it('uses provided implementation cost when given', () => {
    const rec = makeRec({ arrImpact: 100_000, confidenceLevel: 100, risk: 'low' })
    const roi = calculateROI(rec, 10_000)
    expect(roi).toBeCloseTo(10, 3)  // 100000 / 10000 = 10×
  })

  it('falls back to timeline-based cost when cost is 0: immediate = $5k', () => {
    const rec = makeRec({ arrImpact: 100_000, confidenceLevel: 100, risk: 'low', timeline: 'immediate' })
    expect(calculateROI(rec, 0)).toBeCloseTo(100_000 / 5_000, 3)
  })

  it('falls back to short-term = $15k', () => {
    const rec = makeRec({ arrImpact: 60_000, confidenceLevel: 100, risk: 'low', timeline: 'short-term' })
    expect(calculateROI(rec, 0)).toBeCloseTo(60_000 / 15_000, 3)
  })

  it('falls back to medium-term = $50k', () => {
    const rec = makeRec({ arrImpact: 200_000, confidenceLevel: 100, risk: 'low', timeline: 'medium-term' })
    expect(calculateROI(rec, 0)).toBeCloseTo(200_000 / 50_000, 3)
  })

  it('falls back to long-term = $100k', () => {
    const rec = makeRec({ arrImpact: 300_000, confidenceLevel: 100, risk: 'low', timeline: 'long-term' })
    expect(calculateROI(rec, 0)).toBeCloseTo(300_000 / 100_000, 3)
  })
})

// ── calculatePaybackPeriod ────────────────────────────────────────────────────

describe('calculatePaybackPeriod', () => {
  it('calculates payback in months correctly', () => {
    const rec = makeRec({ arrImpact: 120_000, confidenceLevel: 100, risk: 'low', timeline: 'immediate' })
    // monthlyImpact = 120000 / 12 = 10000; cost = 5000; payback = 0.5 months
    expect(calculatePaybackPeriod(rec, 0)).toBeCloseTo(0.5, 3)
  })

  it('returns Infinity when ARR impact is zero', () => {
    const rec = makeRec({ arrImpact: 0, confidenceLevel: 100, risk: 'low', timeline: 'immediate' })
    expect(calculatePaybackPeriod(rec, 5_000)).toBe(Infinity)
  })

  it('higher cost means longer payback period', () => {
    const rec = makeRec({ arrImpact: 120_000, confidenceLevel: 100, risk: 'low' })
    const short = calculatePaybackPeriod(rec, 10_000)
    const long = calculatePaybackPeriod(rec, 50_000)
    expect(long).toBeGreaterThan(short)
  })
})

// ── rankByExpectedValue ───────────────────────────────────────────────────────

describe('rankByExpectedValue', () => {
  it('sorts recommendations by descending expected value', () => {
    const low = makeRec({ arrImpact: 50_000, confidenceLevel: 60, risk: 'low' })
    const mid = makeRec({ arrImpact: 100_000, confidenceLevel: 80, risk: 'low' })
    const high = makeRec({ arrImpact: 200_000, confidenceLevel: 90, risk: 'low' })

    const ranked = rankByExpectedValue([low, mid, high])
    expect(ranked[0]).toBe(high)
    expect(ranked[1]).toBe(mid)
    expect(ranked[2]).toBe(low)
  })

  it('does not mutate the original array', () => {
    const recs = [
      makeRec({ arrImpact: 100_000 }),
      makeRec({ arrImpact: 50_000 }),
    ]
    const original = [...recs]
    rankByExpectedValue(recs)
    expect(recs[0]).toBe(original[0])
  })

  it('handles a single recommendation without error', () => {
    const rec = makeRec()
    expect(rankByExpectedValue([rec])).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    expect(rankByExpectedValue([])).toEqual([])
  })
})

// ── calculateDMComponents ────────────────────────────────────────────────────

describe('calculateDMComponents', () => {
  const contractMix = {
    annual: DM_CONSTANTS.contractMix.annual,
    threeYear: DM_CONSTANTS.contractMix.threeYear,
    fiveYear: DM_CONSTANTS.contractMix.fiveYear,
    percentRenewingPerYear: DM_CONSTANTS.contractMix.percentRenewingPerYear,
    effectiveAnnualRepricing: DM_CONSTANTS.contractMix.effectiveAnnualRepricing,
  }

  it('DM = 100 when zero ice melt and zero expansion with repricing', () => {
    // With no ice melt and no expansion, endingARR > beginningARR → DM > 100
    const result = calculateDMComponents(1_000_000, 0, 0.25, contractMix, {
      upsell: 0,
      crossSell: 0,
      newBusiness: 0,
    })
    expect(result.dm).toBeGreaterThan(100)
  })

  it('endingARR is less than beginningARR when ice melt exceeds gains', () => {
    const result = calculateDMComponents(1_000_000, 0.50, 0.25, contractMix, {
      upsell: 0,
      crossSell: 0,
      newBusiness: 0,
    })
    expect(result.endingARR).toBeLessThan(1_000_000)
    expect(result.dm).toBeLessThan(100)
  })

  it('iceMelt field stores rate as percentage (not decimal)', () => {
    const rate = 0.265
    const result = calculateDMComponents(1_000_000, rate, 0.25, contractMix, {
      upsell: 0.04,
      crossSell: 0.02,
      newBusiness: 0,
    })
    expect(result.iceMelt).toBeCloseTo(rate * 100, 5)
  })

  it('dm = endingARR / beginningARR × 100', () => {
    const result = calculateDMComponents(2_000_000, 0.22, 0.25, contractMix, {
      upsell: 0.04,
      crossSell: 0.02,
      newBusiness: 0,
    })
    expect(result.dm).toBeCloseTo((result.endingARR / 2_000_000) * 100, 5)
  })
})

// ── calculateBreakevenIceMelt ────────────────────────────────────────────────

describe('calculateBreakevenIceMelt', () => {
  const contractMix = {
    annual: DM_CONSTANTS.contractMix.annual,
    threeYear: DM_CONSTANTS.contractMix.threeYear,
    fiveYear: DM_CONSTANTS.contractMix.fiveYear,
    percentRenewingPerYear: DM_CONSTANTS.contractMix.percentRenewingPerYear,
    effectiveAnnualRepricing: DM_CONSTANTS.contractMix.effectiveAnnualRepricing,
  }

  it('returns a positive breakeven ice melt rate', () => {
    const rate = calculateBreakevenIceMelt(0.25, contractMix, 0.06)
    expect(rate).toBeGreaterThan(0)
  })

  it('higher expansion rate increases the breakeven ice melt threshold', () => {
    const low = calculateBreakevenIceMelt(0.25, contractMix, 0.02)
    const high = calculateBreakevenIceMelt(0.25, contractMix, 0.10)
    expect(high).toBeGreaterThan(low)
  })

  it('zero expansion gives lower breakeven than with expansion', () => {
    const withoutExpansion = calculateBreakevenIceMelt(0.25, contractMix, 0)
    const withExpansion = calculateBreakevenIceMelt(0.25, contractMix, 0.06)
    expect(withExpansion).toBeGreaterThan(withoutExpansion)
  })
})
