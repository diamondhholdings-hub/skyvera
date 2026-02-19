/**
 * OverviewTab - Account overview with KPIs, health factors, and intelligence snippet
 * Server Component - receives data as props
 * Displays: ARR, Total Revenue, Health Score, Subscription Count, Quick Summary
 */

import type { CustomerWithHealth } from '@/lib/types/customer'
import type { PainPoint, Opportunity } from '@/lib/types/account-plan'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface OverviewTabProps {
  customer: CustomerWithHealth
  intelligenceReport: string // Raw markdown
  painPoints?: PainPoint[]
  opportunities?: Opportunity[]
}

export function OverviewTab({ customer, intelligenceReport, painPoints = [], opportunities = [] }: OverviewTabProps) {
  const arr = customer.rr * 4
  const subscriptionCount = customer.subscriptions?.length || 0

  // Format currency helper
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${(value / 1000).toFixed(0)}K`
  }

  // Truncate intelligence report for preview (first 500 chars)
  const truncatedReport = intelligenceReport
    ? intelligenceReport.substring(0, 500) + (intelligenceReport.length > 500 ? '...' : '')
    : null

  // Determine if account needs critical alert (yellow or red health)
  const showCriticalAlert = customer.healthScore === 'yellow' || customer.healthScore === 'red'

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner (if health is at risk) */}
      {showCriticalAlert && (
        <div
          className="bg-gradient-to-r from-[var(--critical)] to-[#c62828] text-white p-6 border-l-4 border-[#8b1a1a]"
          style={{ boxShadow: '0 4px 12px rgba(197,75,49,0.2)' }}
        >
          <h3 className="font-display text-xl font-semibold mb-2">
            🚨 CRITICAL: Account Health Alert
          </h3>
          <p className="text-white/90">
            This account shows {customer.healthScore === 'red' ? 'high-risk' : 'moderate-risk'} indicators.
            {customer.healthFactors && customer.healthFactors.length > 0
              ? ` Key concerns: ${customer.healthFactors.slice(0, 2).join(', ')}.`
              : ' Immediate attention required.'}
            {' '}Review the Strategy tab for specific action items and competitive threats.
          </p>
        </div>
      )}

      {/* Keys to Success (Next 90 Days) */}
      <Card title="Keys to Success in Next 90 Days">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-highlight/50 p-4 border-l-3 border-accent">
            <div className="text-xs uppercase tracking-wider text-muted font-bold mb-1">#1 Priority</div>
            <div className="font-display text-base font-semibold text-secondary">
              {customer.healthScore === 'red' ? 'Stabilize Account Relationship' : 'Strengthen Executive Engagement'}
            </div>
          </div>
          <div className="bg-highlight/50 p-4 border-l-3 border-accent">
            <div className="text-xs uppercase tracking-wider text-muted font-bold mb-1">#2 Priority</div>
            <div className="font-display text-base font-semibold text-secondary">
              {subscriptionCount > 0 ? `Secure ${subscriptionCount} Subscription Renewals` : 'Identify Expansion Opportunities'}
            </div>
          </div>
          <div className="bg-highlight/50 p-4 border-l-3 border-accent">
            <div className="text-xs uppercase tracking-wider text-muted font-bold mb-1">#3 Priority</div>
            <div className="font-display text-base font-semibold text-secondary">
              Execute Upsell Strategy
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="ARR" value={formatCurrency(arr)} />
        <KPICard title="Total Revenue" value={formatCurrency(customer.total)} />
        <KPICard title="Health Score" value={customer.healthScore} isHealth />
        <KPICard title="Subscriptions" value={subscriptionCount.toString()} />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Summary */}
        <Card title="Account Summary">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-muted">Customer Name</dt>
              <dd className="text-base text-ink mt-1">{customer.customer_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted">Business Unit</dt>
              <dd className="text-base text-ink mt-1">{customer.bu}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted">Rank</dt>
              <dd className="text-base text-ink mt-1">
                #{customer.rank} of total customers
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted">% of Total Revenue</dt>
              <dd className="text-base text-ink mt-1">
                {customer.pct_of_total !== undefined ? customer.pct_of_total.toFixed(2) : 'N/A'}%
              </dd>
            </div>
          </dl>
        </Card>

        {/* Quick Intelligence */}
        <Card title="Quick Intelligence">
          {truncatedReport ? (
            <div className="space-y-3">
              <p className="text-sm text-ink whitespace-pre-wrap">{truncatedReport}</p>
              <Link
                href={`?tab=intelligence`}
                className="text-sm text-accent hover:text-accent/80 hover:underline inline-block"
              >
                View full report on Intelligence tab →
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted text-sm">No intelligence report available</p>
              <p className="text-xs text-muted/70 mt-1">
                Intelligence reports are generated for key accounts
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Health Factors */}
      <Card title="Health Factors">
        {customer.healthFactors && customer.healthFactors.length > 0 ? (
          <ul className="space-y-2">
            {customer.healthFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted/50 mt-1">•</span>
                <span className="text-sm text-ink">{factor}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No specific health factors recorded</p>
        )}
      </Card>

      {/* W1-P1-005: Risk & Opportunity Summary */}
      {(painPoints.length > 0 || opportunities.length > 0) && (
        <div className="bg-[var(--paper)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="font-display text-xl text-[var(--secondary)] mb-4">Risk & Opportunity Summary</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--critical)] mb-3">Top Risks</h4>
              <ul className="space-y-2">
                {painPoints.slice(0, 3).map((p) => (
                  <li key={p.id} className="text-sm text-[var(--ink)] flex gap-2">
                    <span className="text-[var(--critical)] flex-shrink-0">▸</span>{p.title}
                  </li>
                ))}
                {painPoints.length === 0 && (
                  <li className="text-sm text-[var(--muted)]">No risks identified</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--success)] mb-3">Top Opportunities</h4>
              <ul className="space-y-2">
                {opportunities.slice(0, 3).map((o) => (
                  <li key={o.id} className="text-sm text-[var(--ink)] flex gap-2">
                    <span className="text-[var(--success)] flex-shrink-0">▸</span>{o.title}
                  </li>
                ))}
                {opportunities.length === 0 && (
                  <li className="text-sm text-[var(--muted)]">No opportunities identified</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Simple KPI Card for overview metrics
 */
function KPICard({
  title,
  value,
  isHealth = false,
}: {
  title: string
  value: string | number
  isHealth?: boolean
}) {
  const healthConfig = {
    green: { color: 'bg-success/20 text-[#2e7d32]', icon: '✓' },
    yellow: { color: 'bg-warning/20 text-[#e65100]', icon: '⚠' },
    red: { color: 'bg-critical/20 text-[#c62828]', icon: '✕' },
  }

  return (
    <div className="bg-highlight p-5 border-l-3 border-accent shadow-sm card-hover animate-fade-in">
      <h3 className="text-xs uppercase tracking-wider text-muted font-semibold">{title}</h3>
      {isHealth ? (
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              healthConfig[value as keyof typeof healthConfig]?.color || 'bg-highlight text-muted'
            }`}
          >
            {healthConfig[value as keyof typeof healthConfig]?.icon || '?'}
            <span className="capitalize">{value}</span>
          </span>
        </div>
      ) : (
        <p className="text-2xl font-display font-semibold text-secondary mt-2">{value}</p>
      )}
    </div>
  )
}
