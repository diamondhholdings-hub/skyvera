/**
 * Unit tests for the data-driven alert rules (receivables, renewals, costs)
 * and the dashboard helpers for ARR at risk and headcount.
 */

import { describe, it, expect } from 'vitest'
import {
  buildReceivableAlerts,
  buildRenewalAlerts,
  buildCostAlerts,
  formatUsd,
} from '../../src/lib/data/server/alert-data'
import {
  shiftQuarter,
  quarterWindow,
  computeArrAtRisk,
  headcountFromIntelligence,
} from '../../src/lib/data/server/dashboard-data'
import type { IntelligenceSnapshot, Receivable, Renewal } from '../../src/lib/data/server/intelligence-data'

const NOW = new Date('2026-10-22T00:00:00Z')

function receivable(customer: string, arOver90: number, arrInBudget: number, over10 = true): Receivable {
  return {
    customer,
    bu: 'Kandy',
    arOver90,
    arrInBudget,
    arOver10PctOfArr: over10,
    revenueInBudget: true,
    latestNote: null,
    buComments: null,
  }
}

function renewal(customer: string, quarter: string | null, willRenew: string | null, arr: number, bu = 'STL'): Renewal {
  return {
    bu,
    customer,
    endUser: null,
    subscriptionId: Math.floor(arr),
    start: null,
    end: null,
    arr,
    renewalDate: null,
    renewalQuarter: quarter,
    willRenew,
    upDownSellPct: 0,
    projectedArr: arr,
    arOver90: 0,
  }
}

describe('formatUsd', () => {
  it('formats millions, thousands and units', () => {
    expect(formatUsd(3_849_107)).toBe('$3.85M')
    expect(formatUsd(410_688)).toBe('$411K')
    expect(formatUsd(950)).toBe('$950')
  })
})

describe('buildReceivableAlerts', () => {
  const rows = [
    receivable('EMIRCOM', 3_850_000, 3_440_000), // red: balance and share
    receivable('Small Co', 60_000, 1_000_000), // yellow: 6% of ARR, under $250K
    receivable('Half Co', 120_000, 200_000), // red: 60% of ARR
    receivable('No ARR Co', 70_000, 0), // yellow: no ARR left, balance under $250K
    receivable('Tiny Co', 40_000, 100_000), // below $50K: no customer alert
    receivable('Not flagged', 500_000, 10_000_000, false), // under 10% of ARR
  ]
  const alerts = buildReceivableAlerts(rows, NOW)
  const byAccount = Object.fromEntries(alerts.filter((a) => a.accountName).map((a) => [a.accountName, a]))

  it('raises one alert per flagged customer above $50K', () => {
    expect(Object.keys(byAccount).sort()).toEqual(['EMIRCOM', 'Half Co', 'No ARR Co', 'Small Co'])
  })

  it('is red at $250K or 50% of remaining ARR, else yellow', () => {
    expect(byAccount.EMIRCOM.severity).toBe('red')
    expect(byAccount['Half Co'].severity).toBe('red')
    // No ARR left: only the balance decides
    expect(byAccount['No ARR Co'].severity).toBe('yellow')
    expect(byAccount['Small Co'].severity).toBe('yellow')
  })

  it('states the share of ARR in plain English', () => {
    expect(byAccount.EMIRCOM.description).toContain('112%')
    expect(byAccount['No ARR Co'].description).toContain('no ARR left')
    expect(alerts.every((a) => !a.description.includes('—'))).toBe(true)
  })

  it('adds a portfolio alert naming the largest balance', () => {
    const portfolio = alerts.find((a) => !a.accountName)
    expect(portfolio).toBeDefined()
    expect(portfolio!.severity).toBe('red')
    expect(portfolio!.currentValue).toBe('$4.64M')
    expect(portfolio!.description).toContain('EMIRCOM alone owes $3.85M')
  })

  it('raises no portfolio alert when total AR is small', () => {
    expect(buildReceivableAlerts([receivable('A', 10_000, 1_000_000, false)], NOW)).toEqual([])
  })
})

describe('buildRenewalAlerts', () => {
  const rows = [
    renewal('One Albania', "Q4'26", 'No', 1_600_000),
    renewal('Sub Co', "Q1'27", 'No (SF)', 100_000, 'VoltDelta'),
    renewal('Sub Co', "Q1'27", 'No', 50_000, 'VoltDelta'),
    renewal('Big Next', "Q1'27", 'No', 300_000),
    renewal('Later Co', "Q2'27", 'No', 900_000), // outside window
    renewal('Past Co', "Q3'26", 'No', 900_000), // outside window
    renewal('Happy Co', "Q4'26", 'Yes', 900_000), // renewing
    renewal('Zero Co', "Q4'26", 'No', 0), // no ARR
  ]
  const alerts = buildRenewalAlerts(rows, "Q4'26", NOW)
  const byAccount = Object.fromEntries(alerts.map((a) => [a.accountName, a]))

  it('covers only the current and next quarter, one alert per customer', () => {
    expect(alerts.map((a) => a.accountName)).toEqual(['One Albania', 'Big Next', 'Sub Co'])
  })

  it('aggregates subscriptions per customer', () => {
    expect(byAccount['Sub Co'].currentValue).toBe('$150K')
    expect(byAccount['Sub Co'].description).toContain('2 subscriptions')
    expect(byAccount['Sub Co'].description).toContain('VoltDelta')
  })

  it('is red in the current quarter or at $250K, else yellow', () => {
    expect(byAccount['One Albania'].severity).toBe('red')
    expect(byAccount['Big Next'].severity).toBe('red')
    expect(byAccount['Sub Co'].severity).toBe('yellow')
  })

  it('handles the year rollover', () => {
    const q4 = buildRenewalAlerts([renewal('X', "Q1'27", 'No', 10_000)], "Q4'26", NOW)
    expect(q4).toHaveLength(1)
  })
})

describe('buildCostAlerts', () => {
  const intel = {
    benchmark: {
      note: '',
      summaryPct: {
        totalCost: { 'Skyvera Consolidated': 36.6, 'Standard Benchmark': 25 },
        edge: { 'Skyvera Consolidated': 9, 'Standard Benchmark': 5 },
      },
      costPct: {},
      varianceUsd: {},
      rules: [],
    },
    aiCost: {
      current: "Q4'26",
      yearAgo: "Q4'25",
      metrics: {
        'AI Cost': { "Q4'26": 154_447, "Q4'25": 5_660 },
        'HC + AI Cost on Revenue': { "Q4'26": 10.29, "Q4'25": 3.42 },
      },
      vendors: [],
    },
    vendors: {
      quarters: ["Q4'26", "Q1'27"],
      priorQuarter: "Q3'26",
      lines: [
        { vendor: 'Salesforce', bu: 'Cloudsense', priorQuarterForecast: 545_743, byQuarter: { "Q4'26": 961_545 } },
        { vendor: 'New Vendor', bu: 'STL', priorQuarterForecast: 0, byQuarter: { "Q4'26": 13_750 } },
        { vendor: 'Small Rise', bu: 'STL', priorQuarterForecast: 20_000, byQuarter: { "Q4'26": 29_000 } }, // +45% but +$9K
        { vendor: 'Big Flat', bu: 'STL', priorQuarterForecast: 500_000, byQuarter: { "Q4'26": 600_000 } }, // +20%
      ],
    },
  } as unknown as Pick<IntelligenceSnapshot, 'benchmark' | 'aiCost' | 'vendors'>

  const alerts = buildCostAlerts(intel, "Q4'26", NOW)

  it('flags total cost and Edge spend above the benchmark model', () => {
    const total = alerts.find((a) => a.title === 'Total cost above benchmark')!
    expect(total.severity).toBe('red')
    expect(total.description).toContain('11.6 points')
    const edge = alerts.find((a) => a.title === 'Edge spend above benchmark')!
    expect(edge.severity).toBe('yellow')
  })

  it('flags AI cost growth year over year', () => {
    const ai = alerts.find((a) => a.title === 'AI cost up year over year')!
    expect(ai.severity).toBe('red')
    expect(ai.description).toContain('$154K')
    expect(ai.description).toContain('10.3%')
  })

  it('flags vendors up more than 25% and $10K vs prior forecast', () => {
    const vendors = alerts.filter((a) => a.title === 'Vendor cost increase')
    expect(vendors.map((a) => a.description.split(' (')[0])).toEqual(['Salesforce', 'New Vendor'])
    expect(vendors[0].severity).toBe('red')
    expect(vendors[0].description).toContain('up 76%')
    expect(vendors[1].severity).toBe('yellow')
  })

  it('stays quiet when costs are at the benchmark', () => {
    const quiet = buildCostAlerts(
      {
        ...intel,
        benchmark: { ...intel.benchmark, summaryPct: { totalCost: { 'Skyvera Consolidated': 25, 'Standard Benchmark': 25 } } },
        aiCost: { ...intel.aiCost, metrics: { 'AI Cost': { "Q4'26": 100, "Q4'25": 100 } } },
        vendors: { ...intel.vendors, lines: [] },
      },
      "Q4'26",
      NOW
    )
    expect(quiet).toEqual([])
  })
})

describe('dashboard helpers', () => {
  it('shifts quarter labels across years', () => {
    expect(shiftQuarter("Q4'26", 1)).toBe("Q1'27")
    expect(shiftQuarter("Q1'27", -1)).toBe("Q4'26")
    expect(shiftQuarter('Next Yr', 1)).toBeNull()
    expect(quarterWindow("Q4'26", 4)).toEqual(["Q4'26", "Q1'27", "Q2'27", "Q3'27"])
  })

  it('sums at-risk ARR inside the window', () => {
    const rows = [
      renewal('A', "Q4'26", 'No', 100),
      renewal('A', "Q3'27", 'No (SF)', 50),
      renewal('B', "Q4'27", 'No', 1000), // outside
      renewal('C', "Q1'27", 'Yes', 1000), // renewing
    ]
    expect(computeArrAtRisk(rows, quarterWindow("Q4'26", 4))).toEqual({
      quarters: ["Q4'26", "Q1'27", "Q2'27", "Q3'27"],
      arr: 150,
      subscriptions: 2,
      customers: 1,
    })
  })

  it('reads headcount from the HC summary', () => {
    const hc = headcountFromIntelligence(
      {
        headcount: {
          quarters: ["Q4'26"],
          total: { headcount: 38, averageHeadcount: 38.1, cost: { "Q4'26": 1_044_762 } },
          summary: {
            'Total XO': { headcountEndOfQuarter: 38, averageHeadcount: 38.1, cost: 1_044_762, priorQuarterHeadcount: 40, priorQuarterCost: 1_117_184 },
          },
        } as unknown as IntelligenceSnapshot['headcount'],
      },
      "Q4'26"
    )
    expect(hc).toEqual({ headcount: 38, headcountPriorQuarter: 40, headcountCost: 1_044_762 })
  })
})
