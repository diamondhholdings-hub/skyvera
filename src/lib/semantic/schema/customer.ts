/**
 * Customer health scoring definitions
 * Provides rules for calculating customer health based on RR trends, AR aging, and renewal status
 */

import type { Customer } from '../../types/customer'

export interface HealthScore {
  score: 'green' | 'yellow' | 'red'
  factors: string[]
}

/**
 * Calculate customer health score based on multiple factors
 *
 * Health scoring rules:
 * - GREEN: RR stable or growing, no AR > 90 days concerns, renewal confirmed
 * - YELLOW: RR declining < 10%, some AR > 90 days, renewal uncertain
 * - RED: RR declining > 10%, significant AR > 90 days, renewal at risk
 *
 * @param customer Customer record with subscriptions and revenue data
 * @param context Optional context with AR aging data and historical RR
 */
export function calculateHealthScore(
  customer: Customer,
  context?: {
    arOver90Days?: number
    historicalRR?: number
  }
): HealthScore {
  const factors: string[] = []
  let redFlags = 0
  let yellowFlags = 0

  // Check RR trends (if historical data available)
  if (context?.historicalRR !== undefined && context.historicalRR > 0) {
    const rrChangePercent = ((customer.rr - context.historicalRR) / context.historicalRR) * 100

    if (rrChangePercent < -10) {
      redFlags++
      factors.push(`RR declining ${rrChangePercent.toFixed(1)}% (>10% decline)`)
    } else if (rrChangePercent < 0) {
      yellowFlags++
      factors.push(`RR declining ${rrChangePercent.toFixed(1)}% (<10% decline)`)
    } else if (rrChangePercent > 0) {
      factors.push(`RR growing ${rrChangePercent.toFixed(1)}%`)
    }
  }

  // Check AR aging (if available)
  if (context?.arOver90Days !== undefined) {
    const arPercent = customer.total > 0 ? (context.arOver90Days / customer.total) * 100 : 0

    if (arPercent > 20) {
      redFlags++
      factors.push(`${arPercent.toFixed(1)}% of revenue in AR > 90 days (high risk)`)
    } else if (arPercent > 5) {
      yellowFlags++
      factors.push(`${arPercent.toFixed(1)}% of revenue in AR > 90 days`)
    } else if (context.arOver90Days > 0) {
      factors.push(`Minor AR aging (${arPercent.toFixed(1)}%)`)
    }
  }

  // Check renewal status across all subscriptions
  const subscriptions = customer.subscriptions || []
  const renewalAtRisk = subscriptions.filter(
    (sub) =>
      sub.will_renew === 'No' ||
      sub.will_renew === 'No (SF)' ||
      sub.will_renew === 'BU decision required'
  )
  const renewalUncertain = subscriptions.filter((sub) => sub.will_renew === 'TBD')
  const renewalConfirmed = subscriptions.filter((sub) => sub.will_renew === 'Yes')

  if (renewalAtRisk.length > 0) {
    redFlags++
    factors.push(
      `${renewalAtRisk.length} subscription${renewalAtRisk.length > 1 ? 's' : ''} at renewal risk`
    )
  }

  if (renewalUncertain.length > 0 && renewalConfirmed.length === 0) {
    yellowFlags++
    factors.push(`${renewalUncertain.length} renewal${renewalUncertain.length > 1 ? 's' : ''} uncertain`)
  } else if (renewalConfirmed.length > 0) {
    factors.push(`${renewalConfirmed.length} renewal${renewalConfirmed.length > 1 ? 's' : ''} confirmed`)
  }

  // Check for zero RR (churn signal)
  if (customer.rr === 0 && customer.nrr > 0) {
    redFlags++
    factors.push('No recurring revenue (only NRR remaining)')
  }

  // Determine overall health score
  if (redFlags > 0) {
    return { score: 'red', factors }
  } else if (yellowFlags > 0) {
    return { score: 'yellow', factors }
  } else {
    // If no negative signals, default to green
    if (factors.length === 0) {
      factors.push('No risk indicators detected')
    }
    return { score: 'green', factors }
  }
}
