/**
 * FinancialsTab - Detailed financial metrics and subscription breakdown
 * Server Component - receives customer data as props
 * Telstra-style: dark thead tables, metric-boxes with accent border-left, valid borders
 */

import type { CustomerWithHealth } from '@/lib/types/customer'
import { Calendar } from 'lucide-react'

interface FinancialsTabProps {
  customer: CustomerWithHealth
}

export function FinancialsTab({ customer }: FinancialsTabProps) {
  const arr = customer.rr * 4

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const rrPercent = customer.total > 0 ? (customer.rr / customer.total) * 100 : 0
  const nrrPercent = customer.total > 0 ? (customer.nrr / customer.total) * 100 : 0

  return (
    <div className="space-y-8">
      {/* ARR Metric Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          {
            label: 'ARR',
            value: formatCurrency(arr),
            sub: 'Annual Recurring Revenue',
          },
          {
            label: 'Recurring Revenue',
            value: formatCurrency(customer.rr),
            sub: 'Quarterly recurring',
          },
          {
            label: 'Non-Recurring',
            value: formatCurrency(customer.nrr),
            sub: 'One-time revenue',
          },
          {
            label: 'Total Revenue',
            value: formatCurrency(customer.total),
            sub: 'Combined this period',
          },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="bg-[var(--highlight)] rounded-none p-6"
            style={{ borderLeft: '3px solid var(--accent)' }}
          >
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">{label}</div>
            <div className="font-display text-3xl font-bold text-[var(--secondary)] mb-1">{value}</div>
            <div className="text-xs text-[var(--muted)]">{sub}</div>
          </div>
        ))}
      </div>

      {/* Subscription Data Table */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
          Subscription Details
        </h2>
        <div style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--secondary)] text-white">
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                  Sub ID
                </th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                  ARR
                </th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                  Renewal Quarter
                </th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                  Will Renew
                </th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">
                  Projected ARR
                </th>
              </tr>
            </thead>
            <tbody>
              {customer.subscriptions.length > 0 ? (
                customer.subscriptions.map((sub, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                  >
                    <td className="p-4 text-[var(--ink)] font-medium">
                      {sub.sub_id ?? '—'}
                    </td>
                    <td className="p-4 text-[var(--ink)]">
                      {sub.arr != null ? formatCurrency(sub.arr) : '—'}
                    </td>
                    <td className="p-4 text-[var(--muted)]">{sub.renewal_qtr ?? '—'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                          sub.will_renew === 'Yes'
                            ? 'bg-[var(--success)]'
                            : sub.will_renew === 'No' || sub.will_renew === 'No (SF)'
                            ? 'bg-[var(--critical)]'
                            : 'bg-[var(--warning)]'
                        }`}
                      >
                        {sub.will_renew ?? 'TBD'}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--ink)]">
                      {sub.projected_arr != null ? formatCurrency(sub.projected_arr) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--muted)]">
                    No subscription data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
          Revenue Breakdown
        </h2>
        <div style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: "2rem" }}>
          {/* Stacked bar */}
          <div className="flex h-8 rounded-none overflow-hidden border border-[var(--border)] mb-6">
            {rrPercent > 0 && (
              <div
                className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${rrPercent}%`, background: 'var(--accent)' }}
              >
                {rrPercent > 10 && `${rrPercent.toFixed(0)}%`}
              </div>
            )}
            {nrrPercent > 0 && (
              <div
                className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${nrrPercent}%`, background: 'var(--secondary)' }}
              >
                {nrrPercent > 10 && `${nrrPercent.toFixed(0)}%`}
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: 'var(--accent)' }} />
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  Recurring Revenue: {formatCurrency(customer.rr)}
                </p>
                <p className="text-xs text-[var(--muted)]">{rrPercent.toFixed(1)}% of total</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: 'var(--secondary)' }} />
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  Non-Recurring Revenue: {formatCurrency(customer.nrr)}
                </p>
                <p className="text-xs text-[var(--muted)]">{nrrPercent.toFixed(1)}% of total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
          Account Summary
        </h2>
        <div style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: "2rem" }}>
          <div className="flex items-start gap-4">
            <div
              className="rounded-full p-3 flex-shrink-0"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <div className="font-semibold text-[var(--secondary)] text-lg mb-1">
                {customer.customer_name}
              </div>
              <div className="text-sm text-[var(--muted)]">
                {customer.bu} Business Unit — Rank #{customer.rank ?? '—'} of total accounts.{' '}
                {customer.subscriptions.length > 0
                  ? `${customer.subscriptions.length} active subscription(s) tracked.`
                  : 'No subscriptions on record.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
