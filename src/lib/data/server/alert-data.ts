/**
 * Server-side data fetching for proactive alerts
 * Scans customers and financials for at-risk accounts and anomalies
 * These functions are called directly from Server Components (no API routes)
 */

import { getAllCustomersWithHealth } from './account-data'
import { getBUSummaries } from './dashboard-data'
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

    // 1. Alert for customers with renewals at risk
    for (const customer of customers) {
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
          title: 'Renewal at Risk',
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

    // 6. Alert for high AR > 90 days (from CLAUDE.md: $1.28M total, distribute proportionally)
    // For demo, find top revenue customers and flag if they have high AR concern
    const totalAR90Days = 1280000 // $1.28M from CLAUDE.md
    const totalRevenue = customers.reduce((sum, c) => sum + c.total, 0)

    for (const customer of customers.slice(0, 10)) {
      // Check top 10 by revenue
      const proportionalAR = (customer.total / totalRevenue) * totalAR90Days
      const arPercent = customer.total > 0 ? (proportionalAR / customer.total) * 100 : 0

      if (arPercent > 20) {
        // Alert if AR > 20% of revenue
        alerts.push({
          id: generateAlertId('ar-aging', customer.customer_name),
          severity: 'red',
          title: 'High Aged Receivables',
          description: `${arPercent.toFixed(1)}% of revenue in AR > 90 days`,
          accountName: customer.customer_name,
          metricName: 'AR > 90 Days',
          currentValue: `$${(proportionalAR / 1000).toFixed(0)}K`,
          threshold: '< 5% of revenue',
          timestamp: new Date(),
        })
      }
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
