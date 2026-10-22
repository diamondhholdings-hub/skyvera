/**
 * Server-side data fetching for proactive alerts
 * Scans customers and financials for at-risk accounts and anomalies
 * These functions are called directly from Server Components (no API routes)
 */

import { getAllCustomersWithHealth } from './account-data'
import { getBUSummaries, shiftQuarter } from './dashboard-data'
import { getIntelligence, isAtRiskRenewal, type IntelligenceSnapshot } from './intelligence-data'
import { getFiscalQuarter } from './fiscal-quarter'
import { ok, err, type Result } from '@/lib/types/result'

/**
 * Proactive alert
 */
export interface Alert {
  id: string
  severity: 'red' | 'yellow'
  title: string
  description: string
  accountName?: string
  metricName: string
  currentValue: number | string
  threshold: number | string
  timestamp: Date
}

/**
 * Generate unique alert ID
 */
function generateAlertId(type: string, identifier: string): string {
  return `${type}-${identifier}-${Date.now()}`
}

// --------------------------------------------------------------------------
// Data-driven alert rules over the intelligence snapshot. Pure functions so
// they can be unit tested with fixtures.
// --------------------------------------------------------------------------

/** "$3.85M", "$412K", "$9K" */
export function formatUsd(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}

/** Thresholds for the receivables rules */
export const RECEIVABLE_THRESHOLDS = {
  minBalance: 50_000, // per-customer alert only above this AR > 90 days
  redBalance: 250_000, // red at or above this balance...
  redShareOfArr: 0.5, // ...or when the balance is at least half the customer's ARR
  portfolioRed: 1_000_000,
  portfolioYellow: 250_000,
} as const

/**
 * One alert per customer whose AR over 90 days exceeds 10% of their ARR and
 * $50K, plus one portfolio alert for total AR over 90 days.
 */
export function buildReceivableAlerts(
  receivables: IntelligenceSnapshot['receivables'],
  now: Date = new Date()
): Alert[] {
  const t = RECEIVABLE_THRESHOLDS
  const alerts: Alert[] = []

  const flagged = receivables
    .filter((r) => r.arOver10PctOfArr && r.arOver90 > t.minBalance)
    .sort((a, b) => b.arOver90 - a.arOver90)

  for (const r of flagged) {
    // With no ARR left in budget the share is meaningless, so only the balance decides
    const share = r.arrInBudget > 0 ? r.arOver90 / r.arrInBudget : 0
    const severity: Alert['severity'] =
      r.arOver90 >= t.redBalance || share >= t.redShareOfArr ? 'red' : 'yellow'
    const relation =
      r.arrInBudget > 0
        ? `That is ${(share * 100).toFixed(0)}% of the customer's ${formatUsd(r.arrInBudget)} ARR.`
        : 'The customer has no ARR left in the budget, so this balance is the remaining exposure.'
    alerts.push({
      id: generateAlertId('ar-overdue', r.customer),
      severity,
      title: 'Receivable over 90 days',
      description: `${formatUsd(r.arOver90)} has been unpaid for more than 90 days${r.bu ? ` (${r.bu})` : ''}. ${relation}`,
      accountName: r.customer,
      metricName: 'AR > 90 days',
      currentValue: formatUsd(r.arOver90),
      threshold: 'Red at $250K, or 50% of remaining ARR',
      timestamp: now,
    })
  }

  const total = receivables.reduce((sum, r) => sum + r.arOver90, 0)
  if (total > t.portfolioYellow) {
    const largest = [...receivables].sort((a, b) => b.arOver90 - a.arOver90)[0]
    const owing = receivables.filter((r) => r.arOver90 > 0).length
    const largestShare = largest && total > 0 ? (largest.arOver90 / total) * 100 : 0
    alerts.push({
      id: generateAlertId('ar-overdue', 'portfolio'),
      severity: total >= t.portfolioRed ? 'red' : 'yellow',
      title: 'Total receivables over 90 days',
      description: `${formatUsd(total)} is more than 90 days overdue across ${owing} customers.${
        largest ? ` ${largest.customer} alone owes ${formatUsd(largest.arOver90)}, ${largestShare.toFixed(0)}% of the total.` : ''
      }`,
      metricName: 'AR > 90 days',
      currentValue: formatUsd(total),
      threshold: '< $1.00M',
      timestamp: now,
    })
  }

  return alerts
}

/** Red when the at-risk renewal falls in the current quarter or is at least this much ARR */
export const RENEWAL_RED_ARR = 250_000

/**
 * One alert per customer with subscriptions renewing in the current or next
 * quarter that are marked "No" or "No (SF)". Covers every BU in the renewal
 * tracker, including VoltDelta, ResponseTek, Mobilogy and Service Gateway.
 */
export function buildRenewalAlerts(
  renewals: IntelligenceSnapshot['renewals'],
  currentQuarter: string,
  now: Date = new Date()
): Alert[] {
  const nextQuarter = shiftQuarter(currentQuarter, 1)
  const window = new Set([currentQuarter, nextQuarter].filter((q): q is string => !!q))

  const byCustomer = new Map<string, { customer: string; bu: string | null; arr: number; subs: number; quarters: Set<string> }>()
  for (const r of renewals) {
    if (!r.renewalQuarter || !window.has(r.renewalQuarter) || !isAtRiskRenewal(r)) continue
    const entry = byCustomer.get(r.customer) ?? { customer: r.customer, bu: r.bu, arr: 0, subs: 0, quarters: new Set<string>() }
    entry.arr += r.arr
    entry.subs += 1
    entry.quarters.add(r.renewalQuarter)
    byCustomer.set(r.customer, entry)
  }

  return [...byCustomer.values()]
    .filter((c) => c.arr > 0)
    .sort((a, b) => b.arr - a.arr)
    .map((c) => {
      const inCurrent = c.quarters.has(currentQuarter)
      const quarters = [...c.quarters].sort().join(' and ')
      return {
        id: generateAlertId('renewal-risk', c.customer),
        severity: inCurrent || c.arr >= RENEWAL_RED_ARR ? 'red' : 'yellow',
        title: 'Renewal at risk',
        description: `${c.subs} subscription${c.subs > 1 ? 's' : ''} worth ${formatUsd(c.arr)} ARR renewing in ${quarters} ${
          c.subs > 1 ? 'are' : 'is'
        } marked as not renewing${c.bu ? ` (${c.bu})` : ''}.`,
        accountName: c.customer,
        metricName: 'Renewal status',
        currentValue: formatUsd(c.arr),
        threshold: `Red in ${currentQuarter} or at $250K`,
        timestamp: now,
      } satisfies Alert
    })
}

/** Thresholds for the cost rules */
export const COST_THRESHOLDS = {
  benchmarkYellowPts: 2, // percentage points above the benchmark model
  benchmarkRedPts: 10,
  aiGrowthYellowPct: 50,
  aiGrowthRedPct: 100,
  aiMinIncrease: 10_000,
  aiRedIncrease: 50_000,
  vendorGrowthPct: 25,
  vendorMinIncrease: 10_000,
  vendorRedIncrease: 100_000,
} as const

function benchmarkAlert(
  key: string,
  label: string,
  pct: Record<string, number> | undefined,
  now: Date
): Alert | null {
  const actual = pct?.['Skyvera Consolidated']
  const model = pct?.['Standard Benchmark']
  if (actual === undefined || model === undefined) return null
  const gap = actual - model
  if (gap <= COST_THRESHOLDS.benchmarkYellowPts) return null
  return {
    id: generateAlertId('cost-benchmark', key),
    severity: gap >= COST_THRESHOLDS.benchmarkRedPts ? 'red' : 'yellow',
    title: `${label} above benchmark`,
    description: `${label} is ${actual.toFixed(1)}% of revenue against ${model.toFixed(1)}% in the benchmark model, ${gap.toFixed(1)} points higher.`,
    metricName: `${label} % of revenue`,
    currentValue: `${actual.toFixed(1)}%`,
    threshold: `${model.toFixed(1)}% model`,
    timestamp: now,
  }
}

/**
 * Cost alerts: total cost and Edge spend against the benchmark model, AI cost
 * growth year over year, and vendors whose cost this quarter rose more than
 * 25% and $10K over the prior quarter forecast.
 */
export function buildCostAlerts(
  intel: Pick<IntelligenceSnapshot, 'benchmark' | 'aiCost' | 'vendors'>,
  currentQuarter: string | null,
  now: Date = new Date()
): Alert[] {
  const t = COST_THRESHOLDS
  const alerts: Alert[] = []
  const summary = intel.benchmark?.summaryPct ?? {}

  const total = benchmarkAlert('total-cost', 'Total cost', summary.totalCost, now)
  if (total) alerts.push(total)
  const edge = benchmarkAlert('edge', 'Edge spend', summary.edge, now)
  if (edge) alerts.push(edge)

  // AI cost year over year
  const ai = intel.aiCost
  const aiCost = ai?.metrics?.['AI Cost']
  if (ai && aiCost) {
    const current = aiCost[ai.current] ?? 0
    const yearAgo = aiCost[ai.yearAgo] ?? 0
    const increase = current - yearAgo
    const growthPct = yearAgo > 0 ? (increase / yearAgo) * 100 : current > 0 ? Infinity : 0
    if (increase > t.aiMinIncrease && growthPct > t.aiGrowthYellowPct) {
      const share = ai.metrics['HC + AI Cost on Revenue']
      const shareText =
        share && share[ai.current] !== undefined && share[ai.yearAgo] !== undefined
          ? ` Headcount plus AI cost is ${share[ai.current].toFixed(1)}% of revenue, up from ${share[ai.yearAgo].toFixed(1)}%.`
          : ''
      alerts.push({
        id: generateAlertId('ai-cost', ai.current),
        severity: growthPct > t.aiGrowthRedPct && increase > t.aiRedIncrease ? 'red' : 'yellow',
        title: 'AI cost up year over year',
        description: `AI cost is ${formatUsd(current)} in ${ai.current} against ${formatUsd(yearAgo)} in ${ai.yearAgo}.${shareText}`,
        metricName: 'AI cost',
        currentValue: formatUsd(current),
        threshold: '+50% and +$10K YoY',
        timestamp: now,
      })
    }
  }

  // Vendors: this quarter vs prior quarter forecast
  const vendors = intel.vendors
  const quarter =
    currentQuarter && vendors?.quarters?.includes(currentQuarter) ? currentQuarter : vendors?.quarters?.[0]
  if (vendors && quarter) {
    // Compare per vendor family within a BU: a contract moving between a
    // vendor's entities (Salesforce UK -> Salesforce.Com Inc from 8/1/26)
    // is not an increase.
    const families = new Map<string, { line: (typeof vendors.lines)[number]; current: number; prior: number; entities: Set<string> }>()
    for (const line of vendors.lines) {
      const family = line.vendor.toLowerCase().split(/[^a-z0-9]+/)[0] || line.vendor
      const key = `${family}|${line.bu ?? ''}`
      const entry = families.get(key) ?? { line, current: 0, prior: 0, entities: new Set<string>() }
      entry.current += line.byQuarter[quarter] ?? 0
      entry.prior += line.priorQuarterForecast ?? 0
      entry.entities.add(line.vendor)
      if ((line.byQuarter[quarter] ?? 0) > (entry.line.byQuarter[quarter] ?? 0)) entry.line = line
      families.set(key, entry)
    }
    const rising = [...families.values()]
      .filter(
        ({ current, prior }) =>
          current - prior > t.vendorMinIncrease && (prior <= 0 || current > prior * (1 + t.vendorGrowthPct / 100))
      )
      .sort((a, b) => b.current - b.prior - (a.current - a.prior))
    for (const { line, current, prior } of rising) {
      const increase = current - prior
      const change =
        prior > 0
          ? `up ${((increase / prior) * 100).toFixed(0)}% from ${formatUsd(prior)} in the ${vendors.priorQuarter} forecast`
          : `with nothing in the ${vendors.priorQuarter} forecast`
      alerts.push({
        id: generateAlertId('vendor-cost', [line.vendor, line.bu, line.department].filter(Boolean).join('-')),
        severity: increase >= t.vendorRedIncrease ? 'red' : 'yellow',
        title: 'Vendor cost increase',
        description: `${line.vendor}${line.bu ? ` (${line.bu})` : ''} costs ${formatUsd(current)} in ${quarter}, ${change}.`,
        metricName: 'Vendor cost',
        currentValue: formatUsd(current),
        threshold: '+25% and +$10K vs prior forecast',
        timestamp: now,
      })
    }
  }

  return alerts
}

/** All data-driven alerts from the intelligence snapshot. */
export function buildIntelligenceAlerts(
  intel: IntelligenceSnapshot,
  currentQuarter: string | null,
  now: Date = new Date()
): Alert[] {
  const quarter = currentQuarter ?? intel.aiCost?.current ?? intel.vendors?.quarters?.[0] ?? null
  return [
    ...buildReceivableAlerts(intel.receivables ?? [], now),
    ...(quarter ? buildRenewalAlerts(intel.renewals ?? [], quarter, now) : []),
    ...buildCostAlerts(intel, quarter, now),
  ]
}

/**
 * Get proactive alerts for at-risk accounts and metric anomalies
 */
export async function getProactiveAlerts(): Promise<Result<Alert[], Error>> {
  try {
    const alerts: Alert[] = []

    // Fetch customers with health scores
    const customersResult = await getAllCustomersWithHealth()
    if (!customersResult.success) {
      console.error('[getProactiveAlerts] Failed to fetch customers:', customersResult.error)
      return err(customersResult.error)
    }

    const customers = customersResult.value

    // Fetch BU summaries for margin checks
    const buSummariesResult = await getBUSummaries()
    if (!buSummariesResult.success) {
      console.error('[getProactiveAlerts] Failed to fetch BU summaries:', buSummariesResult.error)
      return err(buSummariesResult.error)
    }

    const buSummaries = buSummariesResult.value

    const intel = getIntelligence()

    // 1. Renewals at risk. The renewal tracker in the intelligence snapshot
    // covers every BU (the customer snapshot only Cloudsense, Kandy, STL and
    // NewNet), so when it is loaded it replaces this rule to avoid two alerts
    // for the same customer; see buildRenewalAlerts.
    for (const customer of intel ? [] : customers) {
      const atRiskSubs = customer.subscriptions.filter(
        (sub) =>
          sub.will_renew === 'No' ||
          sub.will_renew === 'No (SF)' ||
          sub.will_renew === 'BU decision required'
      )

      if (atRiskSubs.length > 0) {
        const totalAtRiskARR = atRiskSubs.reduce((sum, sub) => sum + (sub.arr || 0), 0)

        alerts.push({
          id: generateAlertId('renewal-risk', customer.customer_name),
          severity: 'red',
          title: 'Renewal at risk',
          description: `${atRiskSubs.length} subscription${atRiskSubs.length > 1 ? 's' : ''} at renewal risk with total ARR $${(totalAtRiskARR / 1000).toFixed(0)}K`,
          accountName: customer.customer_name,
          metricName: 'Renewal Status',
          currentValue: `${atRiskSubs.length} at risk`,
          threshold: '0 expected',
          timestamp: new Date(),
        })
      }
    }

    // 2. Alert for customers with zero RR but positive NRR (churn signal)
    for (const customer of customers) {
      if (customer.rr === 0 && customer.nrr > 0) {
        alerts.push({
          id: generateAlertId('churn-signal', customer.customer_name),
          severity: 'red',
          title: 'Churn Signal - No Recurring Revenue',
          description: `Customer has $${(customer.nrr / 1000).toFixed(0)}K NRR but zero recurring revenue`,
          accountName: customer.customer_name,
          metricName: 'Recurring Revenue',
          currentValue: '$0',
          threshold: '> $0',
          timestamp: new Date(),
        })
      }
    }

    // 3. Alert for customers with red health score
    const criticalCustomers = customers.filter((c) => c.healthScore === 'red')
    for (const customer of criticalCustomers.slice(0, 5)) {
      // Limit to top 5 critical by revenue
      alerts.push({
        id: generateAlertId('health-critical', customer.customer_name),
        severity: 'red',
        title: 'Critical Account Health',
        description: customer.healthFactors.join('; '),
        accountName: customer.customer_name,
        metricName: 'Health Score',
        currentValue: 'Critical',
        threshold: 'Healthy',
        timestamp: new Date(),
      })
    }

    // 4. Alert for customers with yellow health score (at risk)
    const atRiskCustomers = customers.filter((c) => c.healthScore === 'yellow')
    for (const customer of atRiskCustomers.slice(0, 5)) {
      // Limit to top 5 at risk by revenue
      alerts.push({
        id: generateAlertId('health-warning', customer.customer_name),
        severity: 'yellow',
        title: 'Account At Risk',
        description: customer.healthFactors.join('; '),
        accountName: customer.customer_name,
        metricName: 'Health Score',
        currentValue: 'At Risk',
        threshold: 'Healthy',
        timestamp: new Date(),
      })
    }

    // 5. Alert for BU-level margin below target
    for (const buSummary of buSummaries) {
      const marginGap = buSummary.netMarginTarget - buSummary.netMarginPct

      if (marginGap > 5) {
        // Alert if more than 5 percentage points below target
        alerts.push({
          id: generateAlertId('margin-gap', buSummary.bu),
          severity: marginGap > 10 ? 'red' : 'yellow',
          title: `${buSummary.bu} Margin Below Target`,
          description: `Net margin is ${marginGap.toFixed(1)} percentage points below target`,
          metricName: 'Net Margin',
          currentValue: `${buSummary.netMarginPct.toFixed(1)}%`,
          threshold: `${buSummary.netMarginTarget.toFixed(1)}%`,
          timestamp: new Date(),
        })
      }
    }

    // 6. Receivables, renewals and costs from the intelligence snapshot
    // (real AR Aging, renewal tracker, benchmark, AI cost and vendor sheets).
    if (intel) {
      alerts.push(...buildIntelligenceAlerts(intel, getFiscalQuarter()))
    }

    // Sort alerts: red severity first, then by current value impact
    alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'red' ? -1 : 1
      }
      // Sort by impact (higher values first if numeric)
      const aValue = typeof a.currentValue === 'number' ? a.currentValue : 0
      const bValue = typeof b.currentValue === 'number' ? b.currentValue : 0
      return bValue - aValue
    })

    console.log(`[getProactiveAlerts] Generated ${alerts.length} alerts`)

    return ok(alerts)
  } catch (error) {
    console.error('[getProactiveAlerts] Unexpected error:', error)
    return err(
      new Error(
        `Failed to generate alerts: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}
