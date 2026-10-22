/**
 * Unit tests for DM% period calculations from the tracker's quarterly history
 */

import { describe, it, expect } from 'vitest'
import { calculatePeriodDMs } from '../../src/lib/intelligence/dm-strategy/adapters'

const history = [
  { quarter: "Q1'26", rr: 110, dm_pct: 96 },
  { quarter: "Q2'26", rr: 105, dm_pct: 93 },
  { quarter: "Q3'26", rr: 100, dm_pct: 90 },
  { quarter: "Q4'26", rr: 85, dm_pct: 78 },
]

describe('calculatePeriodDMs', () => {
  it('reads TTM as the latest quarter vs a year earlier', () => {
    expect(calculatePeriodDMs(history, 88).ttmDM).toBe(78)
  })

  it('computes quarterly as latest RR vs the previous quarter', () => {
    expect(calculatePeriodDMs(history, 88).quarterlyDM).toBeCloseTo(85)
  })

  it('derives a monthly rate that compounds to the quarterly one', () => {
    const { quarterlyDM, monthlyDM } = calculatePeriodDMs(history, 88)
    expect(Math.pow(monthlyDM / 100, 3) * 100).toBeCloseTo(quarterlyDM)
  })

  it('falls back to the plan comparison without history', () => {
    const result = calculatePeriodDMs([], 88)
    expect(result.ttmDM).toBe(88)
    expect(result.quarterlyDM).toBe(88)
  })
})
