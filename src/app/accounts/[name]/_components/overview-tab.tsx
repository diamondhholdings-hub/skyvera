/**
 * OverviewTab - risk alert, 90-day priorities, account status, risk summary, charts
 * Server Component — chart subcomponents are 'use client' wrapped in Suspense
 */

import { Suspense } from 'react'
import type { CustomerWithHealth } from '@/lib/types/customer'
import type { PainPoint, Opportunity } from '@/lib/types/account-plan'
import { CircleAlert, TriangleAlert, Clock } from 'lucide-react'
import { ARRBreakdownChart } from '@/components/charts/arr-breakdown-chart'
import { TopCustomersChart } from '@/components/charts/top-customers-chart'

interface OverviewTabProps {
  customer: CustomerWithHealth
  intelligenceReport: string
  painPoints?: PainPoint[]
  opportunities?: Opportunity[]
  allBuCustomers?: CustomerWithHealth[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  return `$${(value / 1_000).toFixed(0)}K`
}

/** Parse a renewal_qtr string like "Q2 2026" into the first day of that quarter. */
function parseRenewalQtr(qtr: string): Date | null {
  const match = qtr.trim().match(/^Q([1-4])\s+(\d{4})$/)
  if (!match) return null
  const quarterMonth = [0, 3, 6, 9][parseInt(match[1], 10) - 1] // Jan, Apr, Jul, Oct
  return new Date(parseInt(match[2], 10), quarterMonth, 1)
}

type RenewalTone = 'default' | 'success' | 'warning' | 'critical'

/** Return renewal display value and tone for the Account Status table. */
function getRenewalDisplay(
  subscriptions: Array<{ renewal_qtr: string | null; endDate?: string }>
): { text: string; tone: RenewalTone } {
  if (!subscriptions.length) return { text: '—', tone: 'default' }

  const today = new Date()
  let soonestMs = Infinity
  let soonestDate: Date | null = null
  let soonestQtrLabel = ''

  for (const sub of subscriptions) {
    let candidate: Date | null = null
    let label = ''

    if (sub.endDate) {
      candidate = new Date(sub.endDate)
      label = sub.renewal_qtr ?? candidate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    } else if (sub.renewal_qtr) {
      candidate = parseRenewalQtr(sub.renewal_qtr)
      label = sub.renewal_qtr
    }

    if (!candidate || isNaN(candidate.getTime())) continue

    const ms = candidate.getTime() - today.getTime()
    if (ms < soonestMs) {
      soonestMs = ms
      soonestDate = candidate
      soonestQtrLabel = label
    }
  }

  if (!soonestDate) return { text: '—', tone: 'default' }

  const daysUntil = Math.round(soonestMs / (1000 * 60 * 60 * 24))

  if (daysUntil < 0) return { text: 'Renewal overdue', tone: 'critical' }

  const label = soonestQtrLabel || soonestDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  if (daysUntil < 90) return { text: `${label} (${daysUntil} days)`, tone: 'critical' }
  if (daysUntil <= 180) return { text: `${label} (${daysUntil} days)`, tone: 'warning' }
  return { text: `${label} (${daysUntil} days)`, tone: 'success' }
}

const renewalToneColor: Record<RenewalTone, string> = {
  default: 'var(--ink)',
  success: 'var(--success-ink)',
  warning: 'var(--warning-ink)',
  critical: 'var(--critical-ink)',
}

export function OverviewTab({
  customer,
  painPoints = [],
  opportunities = [],
  allBuCustomers = [],
}: OverviewTabProps) {
  const arr = customer.rr + customer.nrr
  const hasAlert = customer.healthScore === 'red' || customer.healthScore === 'yellow'
  const isCritical = customer.healthScore === 'red'
  const topPainPoints = painPoints.slice(0, 3)
  const topOpportunities = opportunities.slice(0, 3)
  const renewal = getRenewalDisplay(customer.subscriptions)

  const defaultPriorities = [
    'Strengthen executive engagement',
    customer.subscriptions.length > 0
      ? `Secure ${customer.subscriptions.length} subscription renewal${customer.subscriptions.length > 1 ? 's' : ''}`
      : 'Identify expansion opportunities',
    'Execute upsell strategy',
  ]

  const priorities = topPainPoints.length >= 3 ? topPainPoints.map((pp) => pp.title) : defaultPriorities

  const statusRows: { label: string; value: React.ReactNode; numeric?: boolean }[] = [
    { label: 'Customer', value: customer.customer_name },
    { label: 'Business unit', value: customer.bu },
    { label: 'Rank', value: customer.rank ? customer.rank : '—', numeric: true },
    { label: customer.rr > 0 ? 'ARR' : 'Annual revenue', value: formatCurrency(arr), numeric: true },
    { label: 'Health score', value: customer.healthScore.charAt(0).toUpperCase() + customer.healthScore.slice(1) },
    { label: 'Share of revenue', value: customer.pct_of_total != null ? `${customer.pct_of_total.toFixed(2)}%` : '—', numeric: true },
    { label: 'Subscriptions', value: customer.subscriptions.length > 0 ? `${customer.subscriptions.length} active` : '—', numeric: true },
  ]

  return (
    <div className="space-y-6">

      {/* Risk alert */}
      {hasAlert && (
        <div className={`alert-box ${isCritical ? 'alert-critical' : 'alert-warning'} m-0 flex items-start gap-3`} role="status">
          {isCritical
            ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <div>
            <p className="m-0 text-sm font-semibold">
              {isCritical ? 'Account at risk: immediate action required' : 'Account risk alert'}
            </p>
            <p className="m-0 mt-1 text-sm">
              {isCritical
                ? 'This account needs executive attention. Review the risk factors below and escalate to account leadership.'
                : 'This account shows moderate-risk indicators that need proactive management.'}
              {customer.healthFactors.length > 0 && ` Key concerns: ${customer.healthFactors.slice(0, 2).join(', ')}.`}
            </p>
          </div>
        </div>
      )}

      {/* Keys to success */}
      <section className="card p-5" aria-labelledby="overview-priorities">
        <h2 id="overview-priorities" className="m-0">Keys to success in the next 90 days</h2>
        <ol className="m-0 mt-3 list-decimal space-y-1.5 pl-5 text-sm" style={{ color: 'var(--ink)' }}>
          {priorities.map((title) => (
            <li key={title} className="pl-1 font-medium">{title}</li>
          ))}
        </ol>
      </section>

      {/* Account status + risk & opportunity summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="overview-status">
          <h2 id="overview-status" className="m-0">Account status</h2>
          <dl className="m-0 mt-3 text-sm">
            {statusRows.map(({ label, value, numeric }) => (
              <div key={label} className="flex items-baseline justify-between gap-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <dt style={{ color: 'var(--muted)' }}>{label}</dt>
                <dd className={`m-0 text-right font-medium ${numeric ? 'num' : ''}`}>{value}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt style={{ color: 'var(--muted)' }}>Next renewal</dt>
              <dd className="num m-0 inline-flex items-center gap-1.5 text-right font-medium" style={{ color: renewalToneColor[renewal.tone] }}>
                {(renewal.tone === 'critical' || renewal.tone === 'warning') && <Clock className="h-3.5 w-3.5" aria-hidden="true" />}
                {renewal.text}
              </dd>
            </div>
          </dl>
        </section>

        <section className="card p-5" aria-labelledby="overview-risk">
          <h2 id="overview-risk" className="m-0">Risk and opportunity summary</h2>
          {painPoints.length > 0 && (
            <>
              <h3 className="m-0 mt-4">Top risks</h3>
              <ul className="m-0 mt-2 list-disc space-y-1.5 pl-5 text-sm">
                {painPoints.slice(0, 3).map(pp => (
                  <li key={pp.id}><span className="font-medium">{pp.title}:</span> <span style={{ color: 'var(--ink-2)' }}>{pp.description.slice(0, 80)}{pp.description.length > 80 ? '…' : ''}</span></li>
                ))}
              </ul>
            </>
          )}
          {topOpportunities.length > 0 && (
            <>
              <h3 className="m-0 mt-4">Top opportunities</h3>
              <ul className="m-0 mt-2 list-disc space-y-1.5 pl-5 text-sm">
                {topOpportunities.map(opp => (
                  <li key={opp.id}>
                    <span className="font-medium">{opp.title}{opp.estimatedValue ? <> (<span className="num">+{formatCurrency(opp.estimatedValue)}</span>)</> : ''}:</span>{' '}
                    <span style={{ color: 'var(--ink-2)' }}>{opp.description.slice(0, 80)}{opp.description.length > 80 ? '…' : ''}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {painPoints.length === 0 && opportunities.length === 0 && (
            <p className="m-0 mt-3 text-sm" style={{ color: 'var(--muted)' }}>No risk or opportunity data yet.</p>
          )}
        </section>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card min-w-0 p-5" aria-labelledby="overview-arr">
          <h2 id="overview-arr" className="m-0 mb-4">ARR breakdown</h2>
          <Suspense fallback={<div className="skeleton" style={{ height: 300 }} />}>
            <ARRBreakdownChart rr={customer.rr} nrr={customer.nrr} />
          </Suspense>
        </section>
        <section className="card min-w-0 p-5" aria-labelledby="overview-top">
          <h2 id="overview-top" className="m-0 mb-4">Top customers in {customer.bu}</h2>
          <Suspense fallback={<div className="skeleton" style={{ height: 320 }} />}>
            <TopCustomersChart allBuCustomers={allBuCustomers} currentCustomerName={customer.customer_name} />
          </Suspense>
        </section>
      </div>

    </div>
  )
}
