/**
 * Unit tests for ScenarioCalculator
 * Tests before/after metric calculations for financial, headcount, and customer scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ScenarioCalculator } from '../../src/lib/intelligence/scenarios/calculator'
import type { BaselineMetrics } from '../../src/lib/data/server/scenario-data'
import type { ScenarioInput } from '../../src/lib/intelligence/scenarios/types'

// Realistic baseline matching Skyvera Q1'26 data
const BASELINE: BaselineMetrics = {
  totalRevenue: 14_700_000,
  totalRR: 12_600_000,
  totalNRR: 2_100_000,
  ebitda: 9_187_500,      // 62.5% margin
  ebitdaTarget: 10_098_900, // 68.7% target
  netMarginPct: 62.5,
  netMarginTarget: 68.7,
  headcount: 58,
  headcountCost: 1_176_000,  // 8% of revenue
  totalCosts: 5_512_500,     // 37.5% of revenue
  customerCount: 140,
}

describe('ScenarioCalculator', () => {
  let calc: ScenarioCalculator

  beforeEach(() => {
    calc = new ScenarioCalculator()
  })

  // ── Financial Scenarios ──────────────────────────────────────────────────────

  describe('financial scenario', () => {
    it('calculates ARR as RR × 4', () => {
      const input: ScenarioInput = {
        type: 'financial',
        description: '5% price increase across all products',
        pricingChange: 5,
        costChange: 0,
        targetMargin: 65,
      }
      const metrics = calc.calculate(input, BASELINE)
      const arrMetric = metrics.find((m) => m.name === 'Annual Recurring Revenue (ARR)')
      const rrMetric = metrics.find((m) => m.name === 'Recurring Revenue')

      expect(arrMetric).toBeDefined()
      expect(rrMetric).toBeDefined()
      // ARR must equal new RR × 4
      expect(arrMetric!.after).toBeCloseTo(rrMetric!.after * 4, 0)
    })

    it('5% price increase raises revenue by 5%', () => {
      const input: ScenarioInput = {
        type: 'financial',
        description: 'Test 5 percent pricing change across portfolio',
        pricingChange: 5,
        costChange: 0,
        targetMargin: 65,
      }
      const metrics = calc.calculate(input, BASELINE)
      const rev = metrics.find((m) => m.name === 'Total Revenue')!

      expect(rev.after).toBeCloseTo(BASELINE.totalRevenue * 1.05, 0)
      expect(rev.changePercent).toBeCloseTo(5, 1)
    })

    it('10% cost reduction improves EBITDA', () => {
      const input: ScenarioInput = {
        type: 'financial',
        description: 'Reduce vendor costs by 10 percent this quarter',
        pricingChange: 0,
        costChange: -10,
        targetMargin: 65,
      }
      const metrics = calc.calculate(input, BASELINE)
      const ebitda = metrics.find((m) => m.name === 'EBITDA')!

      expect(ebitda.after).toBeGreaterThan(BASELINE.ebitda)
      expect(ebitda.change).toBeGreaterThan(0)
    })

    it('zero pricing and zero cost change leaves revenue unchanged', () => {
      const input: ScenarioInput = {
        type: 'financial',
        description: 'No change scenario — baseline pass-through test',
        pricingChange: 0,
        costChange: 0,
        targetMargin: 62.5,
      }
      const metrics = calc.calculate(input, BASELINE)
      const rev = metrics.find((m) => m.name === 'Total Revenue')!
      const rr = metrics.find((m) => m.name === 'Recurring Revenue')!

      expect(rev.after).toBeCloseTo(BASELINE.totalRevenue, 0)
      expect(rr.after).toBeCloseTo(BASELINE.totalRR, 0)
      expect(rev.change).toBeCloseTo(0, 0)
    })

    it('negative pricing change decreases ARR baseline', () => {
      const input: ScenarioInput = {
        type: 'financial',
        description: '20 percent price decrease to retain at-risk accounts',
        pricingChange: -20,
        costChange: 0,
        targetMargin: 50,
      }
      const metrics = calc.calculate(input, BASELINE)
      const arr = metrics.find((m) => m.name === 'Annual Recurring Revenue (ARR)')!

      expect(arr.after).toBeLessThan(BASELINE.totalRR * 4)
      expect(arr.change).toBeLessThan(0)
    })

    it('returns 5 named metrics for financial scenario', () => {
      const input: ScenarioInput = {
        type: 'financial',
        description: 'Standard scenario with all metrics returned',
        pricingChange: 3,
        costChange: 2,
        targetMargin: 63,
      }
      const metrics = calc.calculate(input, BASELINE)
      expect(metrics).toHaveLength(5)
      const names = metrics.map((m) => m.name)
      expect(names).toContain('Total Revenue')
      expect(names).toContain('Recurring Revenue')
      expect(names).toContain('Annual Recurring Revenue (ARR)')
      expect(names).toContain('EBITDA')
      expect(names).toContain('Net Margin %')
    })

    it('each metric has correct change and changePercent fields', () => {
      const input: ScenarioInput = {
        type: 'financial',
        description: 'Verify change fields are correctly computed here',
        pricingChange: 10,
        costChange: 5,
        targetMargin: 65,
      }
      const metrics = calc.calculate(input, BASELINE)
      for (const m of metrics) {
        expect(m.change).toBeCloseTo(m.after - m.before, 5)
        if (m.before !== 0) {
          expect(m.changePercent).toBeCloseTo(((m.after - m.before) / m.before) * 100, 3)
        }
      }
    })
  })

  // ── Headcount Scenarios ──────────────────────────────────────────────────────

  describe('headcount scenario', () => {
    it('adding 2 FTEs increases headcount by exactly 2', () => {
      const input: ScenarioInput = {
        type: 'headcount',
        description: 'Hire two senior engineers for Cloudsense BU',
        headcountChange: 2,
        avgSalaryCost: 120_000,
      }
      const metrics = calc.calculate(input, BASELINE)
      const hc = metrics.find((m) => m.name === 'Headcount')!

      expect(hc.before).toBe(58)
      expect(hc.after).toBe(60)
      expect(hc.change).toBe(2)
    })

    it('quarterly cost impact is annual salary ÷ 4', () => {
      const salary = 120_000
      const input: ScenarioInput = {
        type: 'headcount',
        description: 'Hire two senior engineers for Cloudsense BU',
        headcountChange: 2,
        avgSalaryCost: salary,
      }
      const metrics = calc.calculate(input, BASELINE)
      const hcCost = metrics.find((m) => m.name === 'Headcount Cost')!
      const expectedQuarterlyCost = (2 * salary) / 4

      expect(hcCost.after).toBeCloseTo(BASELINE.headcountCost + expectedQuarterlyCost, 0)
    })

    it('cutting 5 FTEs decreases EBITDA impact and reduces total costs', () => {
      const input: ScenarioInput = {
        type: 'headcount',
        description: 'Reduce STL headcount by five through attrition',
        headcountChange: -5,
        avgSalaryCost: 90_000,
      }
      const metrics = calc.calculate(input, BASELINE)
      const totalCosts = metrics.find((m) => m.name === 'Total Costs')!
      const ebitda = metrics.find((m) => m.name === 'EBITDA')!

      expect(totalCosts.after).toBeLessThan(BASELINE.totalCosts)
      expect(ebitda.after).toBeGreaterThan(BASELINE.ebitda)
    })

    it('zero headcount change leaves all metrics unchanged', () => {
      const input: ScenarioInput = {
        type: 'headcount',
        description: 'No headcount change — baseline verification scenario',
        headcountChange: 0,
        avgSalaryCost: 100_000,
      }
      const metrics = calc.calculate(input, BASELINE)
      const hc = metrics.find((m) => m.name === 'Headcount')!
      const ebitda = metrics.find((m) => m.name === 'EBITDA')!

      expect(hc.change).toBe(0)
      expect(ebitda.change).toBe(0)
    })

    it('revenue is unchanged by headcount — only costs shift', () => {
      const input: ScenarioInput = {
        type: 'headcount',
        description: 'Add 10 FTEs to support Kandy growth targets',
        headcountChange: 10,
        avgSalaryCost: 100_000,
      }
      const metrics = calc.calculate(input, BASELINE)
      // No "Total Revenue" metric in headcount scenario — costs change, not revenue
      const totalCosts = metrics.find((m) => m.name === 'Total Costs')!
      const ebitda = metrics.find((m) => m.name === 'EBITDA')!

      // EBITDA = baselineRevenue - newTotalCosts
      expect(ebitda.after).toBeCloseTo(BASELINE.totalRevenue - totalCosts.after, 0)
    })
  })

  // ── Customer Scenarios ───────────────────────────────────────────────────────

  describe('customer scenario', () => {
    it('calculates new ARR as new RR × 4', () => {
      const input: ScenarioInput = {
        type: 'customer',
        description: 'Model 5% churn with 10 new customer acquisitions',
        churnRate: 5,
        acquisitionCount: 10,
        avgCustomerARR: 100_000,
      }
      const metrics = calc.calculate(input, BASELINE)
      const arr = metrics.find((m) => m.name === 'Annual Recurring Revenue (ARR)')!
      const rr = metrics.find((m) => m.name === 'Recurring Revenue')!

      expect(arr.after).toBeCloseTo(rr.after * 4, 0)
    })

    it('100% churn wipes RR to zero plus acquisition', () => {
      const acqARR = 500_000
      const acqCount = 5
      const input: ScenarioInput = {
        type: 'customer',
        description: 'Extreme scenario — total churn with minimal new acquisition',
        churnRate: 100,
        acquisitionCount: acqCount,
        avgCustomerARR: acqARR,
      }
      const metrics = calc.calculate(input, BASELINE)
      const rr = metrics.find((m) => m.name === 'Recurring Revenue')!
      const expectedRR = 0 + (acqCount * acqARR) / 4

      expect(rr.after).toBeCloseTo(expectedRR, 0)
    })

    it('zero churn and zero acquisition leaves RR unchanged', () => {
      const input: ScenarioInput = {
        type: 'customer',
        description: 'No churn no acquisition — status quo baseline test',
        churnRate: 0,
        acquisitionCount: 0,
        avgCustomerARR: 100_000,
      }
      const metrics = calc.calculate(input, BASELINE)
      const rr = metrics.find((m) => m.name === 'Recurring Revenue')!

      expect(rr.after).toBeCloseTo(BASELINE.totalRR, 0)
      expect(rr.change).toBeCloseTo(0, 0)
    })

    it('net margin percentage is unchanged (margin held constant)', () => {
      const input: ScenarioInput = {
        type: 'customer',
        description: 'Test that margin stays constant across churn scenarios',
        churnRate: 10,
        acquisitionCount: 5,
        avgCustomerARR: 200_000,
      }
      const metrics = calc.calculate(input, BASELINE)
      const margin = metrics.find((m) => m.name === 'Net Margin %')!

      expect(margin.after).toBeCloseTo(BASELINE.netMarginPct, 5)
      expect(margin.change).toBeCloseTo(0, 5)
    })

    it('acquiring high-ARR customers increases total revenue', () => {
      const input: ScenarioInput = {
        type: 'customer',
        description: 'Land 20 new enterprise accounts at 500k ARR each',
        churnRate: 0,
        acquisitionCount: 20,
        avgCustomerARR: 500_000,
      }
      const metrics = calc.calculate(input, BASELINE)
      const rev = metrics.find((m) => m.name === 'Total Revenue')!

      expect(rev.after).toBeGreaterThan(BASELINE.totalRevenue)
    })

    it('customer count tracks churn and acquisition correctly', () => {
      const input: ScenarioInput = {
        type: 'customer',
        description: 'Lose 10 pct of customers gain 15 new ones net positive',
        churnRate: 10,
        acquisitionCount: 15,
        avgCustomerARR: 100_000,
      }
      const metrics = calc.calculate(input, BASELINE)
      const cc = metrics.find((m) => m.name === 'Customer Count')!

      const churned = Math.round(140 * 0.10)  // 14
      const expected = 140 - churned + 15
      expect(cc.after).toBe(expected)
    })
  })

  // ── Unknown / Edge Cases ─────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty array for unrecognised scenario type', () => {
      // Cast to bypass TypeScript — testing runtime safety
      const input = { type: 'unknown_type' } as unknown as ScenarioInput
      const metrics = calc.calculate(input, BASELINE)
      expect(metrics).toEqual([])
    })

    it('handles zero-revenue baseline without dividing by zero', () => {
      const zeroBaseline: BaselineMetrics = {
        ...BASELINE,
        totalRevenue: 0,
        totalRR: 0,
        totalNRR: 0,
        ebitda: 0,
        netMarginPct: 0,
        totalCosts: 0,
        headcountCost: 0,
      }
      const input: ScenarioInput = {
        type: 'financial',
        description: 'Zero revenue baseline should not produce NaN values',
        pricingChange: 5,
        costChange: 0,
        targetMargin: 65,
      }
      const metrics = calc.calculate(input, zeroBaseline)
      for (const m of metrics) {
        expect(m.after).not.toBeNaN()
        expect(m.changePercent).not.toBeNaN()
      }
    })
  })
})
