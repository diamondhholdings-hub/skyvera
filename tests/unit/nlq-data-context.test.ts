/**
 * Unit tests for the NLQ data context built from the budget snapshots
 */

import { describe, it, expect } from 'vitest'
import { getQueryDataContext } from '../../src/lib/intelligence/nlq/data-context'
import snapshot from '../../src/data/skyvera-snapshot.json'

type Context = {
  currentQuarter: string
  businessUnits: Record<string, { netMarginPct: number; netMarginTargetPct: number }>
  company: { recurringRevenue: number }
  retention: { company: { dmVsPriorPlanPct: number } }
  customers: Array<{ name: string; bu: string; annualRR: number }>
}

describe('getQueryDataContext', () => {
  const ctx = getQueryDataContext() as unknown as Context

  it('carries the loaded quarter', () => {
    expect(ctx.currentQuarter).toBe(snapshot.fiscalQuarter)
  })

  it('gives per-BU net margins and targets, excluding the consolidated row', () => {
    expect(Object.keys(ctx.businessUnits).sort()).toEqual(['Cloudsense', 'Kandy', 'STL'])
    const fin = snapshot.financials as Record<string, { netMargin: number }>
    expect(ctx.businessUnits.Kandy.netMarginPct).toBeCloseTo(fin.Kandy.netMargin, 1)
  })

  it('lists every customer, largest first, with the annual figures unchanged', () => {
    const all = Object.values(snapshot.customers).flat()
    expect(ctx.customers).toHaveLength(all.length)
    expect(ctx.customers.some((c) => c.bu === 'NewNet')).toBe(true)
    expect(ctx.customers[0].annualRR).toBe(Math.round(all.reduce((a, c) => (c.total > a.total ? c : a)).rr))
  })

  it('includes retention from the DM tracker', () => {
    expect(ctx.retention.company.dmVsPriorPlanPct).toBeGreaterThan(0)
  })
})
