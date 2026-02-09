/**
 * Scenario calculator - before/after metric calculations
 * Computes financial impact of what-if scenarios
 */

import type { ScenarioInput, ImpactMetric } from './types'
import type { BaselineMetrics } from '@/lib/data/server/scenario-data'

export class ScenarioCalculator {
  /**
   * Calculate impact metrics for a scenario
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
   * Calculate financial scenario impact (pricing/cost changes)
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
   * Calculate headcount scenario impact
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
   * Calculate customer scenario impact (churn/acquisition)
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
