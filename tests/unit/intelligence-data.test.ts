/**
 * Unit tests for the intelligence snapshot helpers and the query tools
 */

import { describe, it, expect } from 'vitest'
import {
  getIntelligence,
  getCustomerIntelligence,
  normalizeCompanyName,
  namesMatch,
  matchRows,
  summarizeRenewals,
  quarterOrder,
} from '../../src/lib/data/server/intelligence-data'
import { queryTools } from '../../src/lib/intelligence/nlq/tools'

describe('company name matching', () => {
  it('ignores case, punctuation and legal suffixes', () => {
    expect(normalizeCompanyName('TELECOM ARGENTINA S.A.')).toBe('telecom argentina')
    expect(namesMatch('Nomia Uk Limited', 'Nomia UK Limited')).toBe(true)
    expect(namesMatch('AT&T SERVICES, INC.', 'At&T Services, Inc.')).toBe(true)
  })

  it('does not match unrelated or too-short names', () => {
    expect(namesMatch('Telefonica UK Limited', 'Telefonica Germany')).toBe(false)
    expect(namesMatch('O2', 'O2 Business')).toBe(false)
  })

  it('prefers exact matches over containment', () => {
    const rows = [{ n: 'Telstra Limited' }, { n: 'Telstra International Limited' }]
    expect(matchRows(rows, (r) => r.n, 'Telstra Limited')).toEqual([{ n: 'Telstra Limited' }])
    // No exact match: fall back to containment
    const telenet = [{ n: 'Telenet BV' }, { n: 'Telenet Group' }]
    expect(matchRows(telenet, (r) => r.n, 'Telenet Group Holding')).toHaveLength(2)
  })
})

describe('renewal summaries', () => {
  it('orders quarters chronologically with Next Yr last', () => {
    const rows = ["Next Yr", "Q1'27", "Q4'26"].map((q) => ({ renewalQuarter: q, arr: 100, willRenew: 'Yes' }))
    expect(summarizeRenewals(rows as never).map((s) => s.quarter)).toEqual(["Q4'26", "Q1'27", 'Next Yr'])
    expect(quarterOrder("Q1'27")).toBeGreaterThan(quarterOrder("Q4'26"))
  })

  it('splits at-risk from renewing ARR', () => {
    const rows = [
      { renewalQuarter: "Q4'26", arr: 100, willRenew: 'Yes' },
      { renewalQuarter: "Q4'26", arr: 40, willRenew: 'No (SF)' },
    ]
    expect(summarizeRenewals(rows as never)[0]).toMatchObject({ arr: 140, renewingArr: 100, atRiskArr: 40 })
  })
})

describe('intelligence snapshot', () => {
  const intel = getIntelligence()!

  it('loads every section', () => {
    for (const key of ['renewals', 'pipeline', 'receivables', 'vendors', 'headcount', 'benchmark', 'history'] as const) {
      expect(intel[key]).toBeTruthy()
    }
  })

  it('reconciles receivables and headcount to the workbook totals', () => {
    const totalAR = intel.receivables.reduce((s, r) => s + r.arOver90, 0)
    expect(totalAR).toBeGreaterThan(0)
    const departmentHeads = intel.headcount.byDepartment.reduce((s, g) => s + g.headcount, 0)
    expect(departmentHeads).toBe(intel.headcount.total.headcount)
  })

  it('stores pipeline probability as a percent', () => {
    expect(Math.max(...intel.pipeline.map((p) => p.probabilityPct))).toBeLessThanOrEqual(100)
    expect(intel.pipeline.some((p) => p.probabilityPct > 1)).toBe(true)
  })

  it('never carries individual names in headcount', () => {
    const text = JSON.stringify(intel.headcount)
    expect(text).not.toMatch(/Full Name|salary|PCCAT/i)
    expect(intel.headcount.adjustments.every((a) => !/hire fee -/i.test(a.description))).toBe(true)
  })

  it('finds a customer across sheets', () => {
    const emircom = getCustomerIntelligence('Emircom')
    expect(emircom.renewals.length).toBeGreaterThan(0)
    expect(emircom.receivable?.arOver90).toBeGreaterThan(0)
  })
})

describe('query tools', () => {
  const tool = (name: string) => (queryTools as unknown as Array<{ name: string; run: (a: object) => Promise<string> }>).find((t) => t.name === name)!

  it('every tool returns JSON under 20K characters', async () => {
    for (const t of queryTools as unknown as Array<{ name: string; run: (a: object) => Promise<string> }>) {
      const out = await t.run(t.name === 'get_customer' ? { name: 'EMIRCOM' } : {})
      expect(() => JSON.parse(out), t.name).not.toThrow()
      expect(out.length, t.name).toBeLessThan(20_000)
    }
  })

  it('filters vendors by business unit', async () => {
    const out = JSON.parse(await tool('get_vendors').run({ bu: 'Kandy' }))
    expect(out.byBU.map((b: { bu: string }) => b.bu)).toEqual(['Kandy'])
  })

  it('reports a missing customer instead of throwing', async () => {
    const out = JSON.parse(await tool('get_customer').run({ name: 'No Such Company Anywhere' }))
    expect(out.error).toMatch(/No customer/)
  })
})
