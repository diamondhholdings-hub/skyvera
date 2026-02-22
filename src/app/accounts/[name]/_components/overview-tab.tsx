/**
 * OverviewTab - Account overview with Telstra-style design
 * Server Component - receives customer data as props
 * Displays: alert banner, 90-day priorities, account status, KPIs, risks, opportunities
 */

import type { CustomerWithHealth } from '@/lib/types/customer'
import type { PainPoint, Opportunity } from '@/lib/types/account-plan'
import { AlertTriangle, TrendingUp, TrendingDown, Shield } from 'lucide-react'

interface OverviewTabProps {
  customer: CustomerWithHealth
  intelligenceReport: string // Raw markdown
  painPoints?: PainPoint[]
  opportunities?: Opportunity[]
}

export function OverviewTab({
  customer,
  intelligenceReport,
  painPoints = [],
  opportunities = [],
}: OverviewTabProps) {
  const arr = customer.rr * 4
  const hasAlert = customer.healthScore === 'red' || customer.healthScore === 'yellow'

  // Top 3 critical pain points as 90-day priorities
  const topPainPoints = painPoints.slice(0, 3)

  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    return `$${(value / 1_000).toFixed(0)}K`
  }

  const priorityLabels = ['30-Day', '60-Day', '90-Day']

  return (
    <div className="space-y-8">
      {/* Alert Banner */}
      {hasAlert && (
        <div
          className="text-white rounded-none p-5 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--critical), #d4594a)',
            borderLeft: '5px solid rgba(255,255,255,0.3)',
          }}
        >
          <div className="flex items-center gap-3 font-bold text-lg mb-2">
            <AlertTriangle size={20} />
            ACCOUNT RISK ALERT
          </div>
          <div className="text-white/90 text-sm leading-relaxed">
            {customer.healthScore === 'red'
              ? 'This account is at high risk and requires immediate executive attention.'
              : 'This account shows moderate-risk indicators requiring proactive management.'}
            {customer.healthFactors.length > 0
              ? ` Key concerns: ${customer.healthFactors.slice(0, 2).join(', ')}.`
              : ''}
          </div>
        </div>
      )}

      {/* 90-Day Priority Metric Boxes */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
          90-Day Priorities
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {topPainPoints.length > 0 ? (
            topPainPoints.map((pp, i) => (
              <div
                key={pp.id}
                className="bg-[var(--highlight)] rounded-none p-6"
                style={{ borderLeft: '3px solid var(--accent)' }}
              >
                <div className="font-display text-3xl font-bold text-[var(--secondary)] mb-1">
                  {priorityLabels[i]}
                </div>
                <div className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">
                  {pp.severity} severity
                </div>
                <div className="text-sm text-[var(--ink)] font-medium leading-snug">
                  {pp.title}
                </div>
              </div>
            ))
          ) : (
            [
              { label: '30-Day', title: 'Strengthen Executive Engagement' },
              {
                label: '60-Day',
                title:
                  customer.subscriptions.length > 0
                    ? `Secure ${customer.subscriptions.length} Subscription Renewals`
                    : 'Identify Expansion Opportunities',
              },
              { label: '90-Day', title: 'Execute Upsell Strategy' },
            ].map(({ label, title }, i) => (
              <div
                key={i}
                className="bg-[var(--highlight)] rounded-none p-6"
                style={{ borderLeft: '3px solid var(--accent)' }}
              >
                <div className="font-display text-3xl font-bold text-[var(--secondary)] mb-1">
                  {label}
                </div>
                <div className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">
                  priority
                </div>
                <div className="text-sm text-[var(--ink)] font-medium leading-snug">{title}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2-Column: Account Status + KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        {/* Account Status */}
        <div className="bg-white rounded-none border border-[var(--border)] p-6">
          <h3 className="font-display text-xl font-semibold text-[var(--secondary)] mb-4">
            Account Status
          </h3>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {[
                { label: 'Account', value: customer.customer_name },
                { label: 'Business Unit', value: customer.bu },
                { label: 'Rank', value: `#${customer.rank ?? '—'} of accounts` },
                {
                  label: 'ARR',
                  value: formatCurrency(arr),
                },
                {
                  label: 'Health Score',
                  value: customer.healthScore.charAt(0).toUpperCase() + customer.healthScore.slice(1),
                },
                {
                  label: '% of Revenue',
                  value: customer.pct_of_total != null ? `${customer.pct_of_total.toFixed(2)}%` : '—',
                },
              ].map(({ label, value }) => (
                <tr key={label} className="border-b border-[var(--border)]">
                  <td className="py-3 pr-4 text-xs uppercase tracking-widest text-[var(--muted)] font-semibold w-36">
                    {label}
                  </td>
                  <td className="py-3 text-[var(--ink)] font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue KPIs */}
        <div className="bg-white rounded-none border border-[var(--border)] p-6">
          <h3 className="font-display text-xl font-semibold text-[var(--secondary)] mb-4">
            Revenue Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {[
              {
                label: 'ARR',
                value: formatCurrency(arr),
                icon: <TrendingUp size={16} className="text-[var(--success)]" />,
              },
              {
                label: 'Recurring Rev',
                value: formatCurrency(customer.rr),
                icon: <Shield size={16} className="text-[var(--accent)]" />,
              },
              {
                label: 'Non-Recurring',
                value: formatCurrency(customer.nrr),
                icon:
                  customer.nrr > 0 ? (
                    <TrendingUp size={16} className="text-[var(--success)]" />
                  ) : (
                    <TrendingDown size={16} className="text-[var(--critical)]" />
                  ),
              },
              {
                label: 'Subscriptions',
                value: `${customer.subscriptions.length}`,
                icon: null,
              },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="bg-[var(--highlight)] rounded-none p-4"
                style={{ borderLeft: '3px solid var(--accent)' }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {icon}
                  <span className="text-xs text-[var(--muted)] uppercase tracking-widest">
                    {label}
                  </span>
                </div>
                <div className="font-display text-xl font-bold text-[var(--secondary)]">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pain Points (Risks) Table */}
      {painPoints.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Risk Register
          </h2>
          <div className="bg-white rounded-none border border-[var(--border)] overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                    Risk
                  </th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                    Severity
                  </th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {painPoints.map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                  >
                    <td className="p-4 text-[var(--ink)]">{risk.title}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                          risk.severity === 'high'
                            ? 'bg-[var(--critical)]'
                            : risk.severity === 'medium'
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--success)]'
                        }`}
                      >
                        {risk.severity}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--muted)] text-sm">{risk.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opportunities Table */}
      {opportunities.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Expansion Opportunities
          </h2>
          <div className="bg-white rounded-none border border-[var(--border)] overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                    Opportunity
                  </th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                    Value
                  </th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                  >
                    <td className="p-4 text-[var(--ink)] font-medium">{opp.title}</td>
                    <td className="p-4 text-[var(--ink)]">
                      {opp.estimatedValue ? `$${(opp.estimatedValue / 1_000).toFixed(0)}K` : '—'}
                    </td>
                    <td className="p-4 text-[var(--muted)]">{opp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Health Factors */}
      {customer.healthFactors.length > 0 && (
        <div className="bg-white rounded-none border border-[var(--border)] p-6">
          <h3 className="font-display text-xl font-semibold text-[var(--secondary)] mb-4">
            Health Factors
          </h3>
          <ul className="space-y-2">
            {customer.healthFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--ink)]">
                <span className="text-[var(--muted)]/60 mt-0.5">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
