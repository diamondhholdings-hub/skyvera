/**
 * Scenario calculator - before/after metric calculations
 * Computes financial impact of what-if scenarios
 */

import type { ScenarioInput, ImpactMetric } from './types'
import type { BaselineMetrics } from '@/lib/data/server/scenario-data'

export class ScenarioCalculator {
  /**
   * Dispatch a what-if scenario to the appropriate calculator and return a list of
   * before/after impact metrics.
   *
   * Three scenario types are supported:
   * - `financial`  — pricing or cost-structure changes (e.g. "+5% price increase")
   * - `headcount`  — FTE adds/cuts with annualised salary cost impact
   * - `customer`   — churn and/or new-logo acquisition
   *
   * Returns an empty array for unrecognised scenario types rather than throwing,
   * so callers can safely render "no changes" without error handling.
   *
   * @param input    Typed scenario parameters (discriminated union on `type`)
   * @param baseline Current-quarter actuals used as the "before" state
   * @returns        Array of named metrics each with before, after, change, and changePercent
   */
  calculate(input: ScenarioInput, baseline: BaselineMetrics): ImpactMetric[] {
    switch (input.type) {
      case 'financial':
        return this.calculateFinancialImpact(input, baseline)
      case 'headcount':
        return this.calculateHeadcountImpact(input, baseline)
      case 'customer':
        return this.calculateCustomerImpact(input, baseline)
      default:
        return []
    }
  }

  /**
   * Model the P&L effect of a simultaneous pricing and/or cost change.
   *
   * Key assumptions baked in:
   * - Pricing change applies proportionally to RR only (NRR is treated as fixed).
   * - ARR is derived as newRR × 4 (quarterly RR annualised).
   * - Cost change applies to the entire cost base, not just COGS or a single line.
   * - EBITDA = newRevenue − newCosts (no tax/interest adjustments at this level).
   *
   * @example
   * // Cloudsense +3% price increase with no cost change
   * calculator.calculate({ type: 'financial', pricingChange: 3, costChange: 0 }, baseline)
   * // → [{ name: 'Total Revenue', before: 8_000_000, after: 8_240_000, ... }, ...]
   */
  private calculateFinancialImpact(
    input: Extract<ScenarioInput, { type: 'financial' }>,
    baseline: BaselineMetrics
  ): ImpactMetric[] {
    // Calculate new revenue from pricing change
    const newRevenue = baseline.totalRevenue * (1 + input.pricingChange / 100)

    // Calculate new costs from cost change
    const newCosts = baseline.totalCosts * (1 + input.costChange / 100)

    // Calculate new EBITDA
    const newEBITDA = newRevenue - newCosts

    // Calculate new net margin percentage
    const newMarginPct = newRevenue > 0 ? (newEBITDA / newRevenue) * 100 : 0

    // Calculate new ARR from RR (assuming pricing affects RR proportionally)
    const newRR = baseline.totalRR * (1 + input.pricingChange / 100)
    const newARR = newRR * 4

    return [
      this.createMetric('Total Revenue', baseline.totalRevenue, newRevenue),
      this.createMetric('Recurring Revenue', baseline.totalRR, newRR),
      this.createMetric('Annual Recurring Revenue (ARR)', baseline.totalRR * 4, newARR),
      this.createMetric('EBITDA', baseline.ebitda, newEBITDA),
      this.createMetric('Net Margin %', baseline.netMarginPct, newMarginPct),
    ]
  }

  /**
   * Model the cost and margin effect of adding or removing headcount.
   *
   * The annual salary cost is divided by 4 to get the quarterly P&L hit,
   * keeping all baseline metrics on a per-quarter basis.
   * Revenue is assumed unchanged — this is a pure cost-side scenario.
   * A negative `headcountChange` (reduction) improves margin accordingly.
   *
   * @example
   * // Hire 2 engineers at $120K each → +$60K quarterly cost
   * calculator.calculate({ type: 'headcount', headcountChange: 2, avgSalaryCost: 120_000 }, baseline)
   */
  private calculateHeadcountImpact(
    input: Extract<ScenarioInput, { type: 'headcount' }>,
    baseline: BaselineMetrics
  ): ImpactMetric[] {
    // Calculate quarterly cost impact (annual salary / 4)
    const quarterlyCostImpact = (input.headcountChange * input.avgSalaryCost) / 4

    // New headcount cost
    const newHeadcountCost = baseline.headcountCost + quarterlyCostImpact

    // New total costs
    const newTotalCosts = baseline.totalCosts + quarterlyCostImpact

    // New EBITDA (revenue unchanged, costs changed)
    const newEBITDA = baseline.totalRevenue - newTotalCosts

    // New net margin
    const newMarginPct = baseline.totalRevenue > 0 ? (newEBITDA / baseline.totalRevenue) * 100 : 0

    // New headcount
    const newHeadcount = baseline.headcount + input.headcountChange

    return [
      this.createMetric('Headcount', baseline.headcount, newHeadcount),
      this.createMetric('Headcount Cost', baseline.headcountCost, newHeadcountCost),
      this.createMetric('Total Costs', baseline.totalCosts, newTotalCosts),
      this.createMetric('EBITDA', baseline.ebitda, newEBITDA),
      this.createMetric('Net Margin %', baseline.netMarginPct, newMarginPct),
    ]
  }

  /**
   * Model the revenue effect of simultaneous churn and new-logo acquisition.
   *
   * Churn removes a percentage of current RR; acquisition adds quarterly revenue
   * derived from annual ARR of new logos (acquisitionCount × avgCustomerARR ÷ 4).
   * EBITDA is projected by holding the current net margin percentage constant —
   * i.e. the cost base scales with revenue, which is a simplification suitable
   * for high-level scenario planning but not precise budgeting.
   *
   * @example
   * // 5% Kandy churn + 3 new logos at $200K ARR each
   * calculator.calculate({ type: 'customer', churnRate: 5, acquisitionCount: 3, avgCustomerARR: 200_000 }, baseline)
   */
  private calculateCustomerImpact(
    input: Extract<ScenarioInput, { type: 'customer' }>,
    baseline: BaselineMetrics
  ): ImpactMetric[] {
    // Calculate churn impact on RR (quarterly)
    const churnImpact = baseline.totalRR * (input.churnRate / 100)

    // Calculate acquisition impact on RR (quarterly from annual ARR)
    const acquisitionImpact = (input.acquisitionCount * input.avgCustomerARR) / 4

    // Net RR change
    const newRR = baseline.totalRR - churnImpact + acquisitionImpact

    // New total revenue (RR + NRR unchanged)
    const newTotalRevenue = newRR + baseline.totalNRR

    // New EBITDA (margin percentage stays constant)
    const newEBITDA = newTotalRevenue * (baseline.netMarginPct / 100)

    // New customer count
    const churnedCustomers = Math.round(baseline.customerCount * (input.churnRate / 100))
    const newCustomerCount = baseline.customerCount - churnedCustomers + input.acquisitionCount

    // Calculate ARR
    const newARR = newRR * 4

    return [
      this.createMetric('Customer Count', baseline.customerCount, newCustomerCount),
      this.createMetric('Recurring Revenue', baseline.totalRR, newRR),
      this.createMetric('Annual Recurring Revenue (ARR)', baseline.totalRR * 4, newARR),
      this.createMetric('Total Revenue', baseline.totalRevenue, newTotalRevenue),
      this.createMetric('EBITDA', baseline.ebitda, newEBITDA),
      this.createMetric('Net Margin %', baseline.netMarginPct, baseline.netMarginPct), // Unchanged
    ]
  }

  /**
   * Create impact metric with change calculations
   */
  private createMetric(name: string, before: number, after: number): ImpactMetric {
    const change = after - before
    const changePercent = before !== 0 ? (change / before) * 100 : 0

    return {
      name,
      before,
      after,
      change,
      changePercent,
    }
  }
}
