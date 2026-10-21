/**
 * FinancialsTab - revenue KPIs, contract table, revenue mix, charts, strategic impact
 * Server Component — chart subcomponents are 'use client'
 */

import { Suspense } from 'react'
import type { CustomerWithHealth } from '@/lib/types/customer'
import { RevenueGrowthChart } from '@/components/charts/revenue-growth-chart'
import { TopCustomersChart } from '@/components/charts/top-customers-chart'
import { KpiStrip } from '@/components/ui/kpi-strip'

interface FinancialsTabProps {
  customer: CustomerWithHealth
  allBuCustomers?: CustomerWithHealth[]
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function BadgeGrowth({ current, projected }: { current: number; projected: number }) {
  if (!projected || !current) return <span style={{ color: 'var(--muted)' }}>—</span>
  const pct = ((projected - current) / current) * 100
  const isPositive = pct >= 0
  return (
    <span className="num font-medium" style={{ color: isPositive ? 'var(--success-ink)' : 'var(--critical-ink)' }}>
      {isPositive ? '+' : ''}{pct.toFixed(0)}%
    </span>
  )
}

function renewClass(willRenew: string | null | undefined): string {
  if (willRenew === 'Yes') return 'badge-success'
  if (willRenew?.startsWith('No')) return 'badge-critical'
  return 'badge-warning'
}

const tagClass = 'inline-flex items-center whitespace-nowrap px-1.5 py-0.5 text-xs font-medium'

export function FinancialsTab({ customer, allBuCustomers = [] }: FinancialsTabProps) {
  const totalCurrentARR = customer.subscriptions.reduce((sum, s) => sum + (s.arr ?? 0), 0)
  const totalProjectedARR = customer.subscriptions.reduce((sum, s) => sum + (s.projected_arr ?? s.arr ?? 0), 0)
  const rrPercent = customer.total > 0 ? (customer.rr / customer.total) * 100 : 0
  const nrrPercent = customer.total > 0 ? (customer.nrr / customer.total) * 100 : 0

  // Strategic impact figures
  const buTotal = allBuCustomers.reduce((sum, c) => sum + c.rr + c.nrr, 0)
  const buPct = buTotal > 0 ? (((customer.rr + customer.nrr) / buTotal) * 100).toFixed(1) : '—'

  const impactRows = [
    { label: 'If account churned', value: `-${formatCurrency(Math.round((customer.rr + customer.nrr) / 4))}`, sub: 'Quarterly revenue impact' },
    { label: 'Share of BU revenue', value: buPct !== '—' ? `${buPct}%` : '—', sub: `Share of ${customer.bu} total` },
    { label: 'Subscription count', value: `${customer.subscriptions.length}`, sub: 'Active subscriptions tracked' },
    { label: 'Upsell potential', value: totalProjectedARR > totalCurrentARR ? `+${formatCurrency(totalProjectedARR - totalCurrentARR)}` : '—', sub: 'If projected ARR executes' },
    { label: 'Health score', value: customer.healthScore.charAt(0).toUpperCase() + customer.healthScore.slice(1), sub: 'Current account health' },
    { label: 'Rank in BU', value: customer.rank ? `${customer.rank}` : '—', sub: 'By total revenue' },
  ]

  return (
    <div className="space-y-6">

      {/* Wrapped: KpiStrip sets an inline margin:0 that would cancel space-y */}
      <div>
      <KpiStrip
        items={[
          { label: customer.rr > 0 ? 'ARR' : 'Annual revenue', value: formatCurrency(customer.rr > 0 ? customer.rr : customer.nrr), context: customer.rr > 0 ? 'Annual recurring revenue' : 'Non-recurring revenue' },
          { label: 'Recurring revenue', value: formatCurrency(customer.rr), context: 'Recurring this period' },
          { label: 'Non-recurring', value: formatCurrency(customer.nrr), context: 'One-time revenue' },
          { label: 'Total revenue', value: formatCurrency(customer.total), context: 'Combined this period' },
        ]}
      />
      </div>

      {/* Contract / Subscription Table */}
      <section className="card overflow-hidden" aria-labelledby="fin-contracts">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="fin-contracts" className="m-0">Contract summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" style={{ minWidth: '820px' }}>
            <thead>
              <tr>
                <th scope="col">Subscription ID</th>
                <th scope="col">Start date</th>
                <th scope="col">End date</th>
                <th scope="col" style={{ textAlign: 'right' }}>Current ARR</th>
                <th scope="col" style={{ textAlign: 'right' }}>Projected ARR</th>
                <th scope="col" style={{ textAlign: 'right' }}>Growth</th>
                <th scope="col">Renewal</th>
                <th scope="col">Will renew</th>
              </tr>
            </thead>
            <tbody>
              {customer.subscriptions.length > 0 ? customer.subscriptions.map((sub, i) => (
                <tr key={i}>
                  <td className="font-medium">{sub.sub_id ?? '—'}</td>
                  <td className="num" style={{ color: 'var(--ink-2)' }}>{sub.startDate ?? '—'}</td>
                  <td className="num" style={{ color: 'var(--ink-2)' }}>{sub.endDate ?? '—'}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{sub.arr != null ? formatCurrency(sub.arr) : '—'}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{sub.projected_arr != null ? formatCurrency(sub.projected_arr) : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {sub.arr && sub.projected_arr
                      ? <BadgeGrowth current={sub.arr} projected={sub.projected_arr} />
                      : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--ink-2)' }}>{sub.renewal_qtr ?? '—'}</td>
                  <td>
                    <span className={`${tagClass} ${renewClass(sub.will_renew)}`} style={{ borderRadius: 'var(--radius-xs)' }}>
                      {sub.will_renew ?? 'TBD'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="py-8 text-center" style={{ color: 'var(--muted)' }}>No subscription data</td></tr>
              )}
            </tbody>
            {customer.subscriptions.length > 1 && (
              <tfoot>
                <tr style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
                  <td colSpan={3} className="font-semibold">Total</td>
                  <td className="num font-semibold" style={{ textAlign: 'right' }}>{formatCurrency(totalCurrentARR)}</td>
                  <td className="num font-semibold" style={{ textAlign: 'right' }}>{formatCurrency(totalProjectedARR)}</td>
                  <td style={{ textAlign: 'right' }}><BadgeGrowth current={totalCurrentARR} projected={totalProjectedARR} /></td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Revenue Breakdown bar */}
      <section className="card p-5" aria-labelledby="fin-breakdown">
        <h2 id="fin-breakdown" className="m-0 mb-4">Revenue breakdown</h2>
        <div
          className="mb-4 flex h-2.5 overflow-hidden"
          style={{ background: 'var(--surface-3)', borderRadius: 'var(--radius-xs)' }}
          role="img"
          aria-label={`Recurring ${rrPercent.toFixed(0)}%, non-recurring ${nrrPercent.toFixed(0)}%`}
        >
          {rrPercent > 0 && <div style={{ width: `${rrPercent}%`, background: 'var(--secondary)' }} />}
          {nrrPercent > 0 && <div style={{ width: `${nrrPercent}%`, background: 'var(--accent)' }} />}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0" style={{ background: 'var(--secondary)', borderRadius: '2px' }} aria-hidden="true" />
            <div>
              <p className="m-0 text-sm font-medium">Recurring revenue: <span className="num">{formatCurrency(customer.rr)}</span></p>
              <p className="m-0 text-xs" style={{ color: 'var(--muted)' }}><span className="num">{rrPercent.toFixed(1)}%</span> of total</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0" style={{ background: 'var(--accent)', borderRadius: '2px' }} aria-hidden="true" />
            <div>
              <p className="m-0 text-sm font-medium">Non-recurring: <span className="num">{formatCurrency(customer.nrr)}</span></p>
              <p className="m-0 text-xs" style={{ color: 'var(--muted)' }}><span className="num">{nrrPercent.toFixed(1)}%</span> of total</p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card min-w-0 p-5" aria-labelledby="fin-growth">
          <h2 id="fin-growth" className="m-0 mb-4">Revenue growth projection</h2>
          <Suspense fallback={<div className="skeleton" style={{ height: 300 }} />}>
            <RevenueGrowthChart subscriptions={customer.subscriptions} />
          </Suspense>
        </section>
        <section className="card min-w-0 p-5" aria-labelledby="fin-top">
          <h2 id="fin-top" className="m-0 mb-4">Top customers in {customer.bu}</h2>
          <Suspense fallback={<div className="skeleton" style={{ height: 320 }} />}>
            <TopCustomersChart allBuCustomers={allBuCustomers} currentCustomerName={customer.customer_name} />
          </Suspense>
        </section>
      </div>

      {/* Strategic Impact Analysis */}
      <section className="card overflow-hidden" aria-labelledby="fin-impact">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="fin-impact" className="m-0">Strategic impact</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col" style={{ textAlign: 'right' }}>Value</th>
                <th scope="col">Basis</th>
              </tr>
            </thead>
            <tbody>
              {impactRows.map(({ label, value, sub }) => (
                <tr key={label}>
                  <td className="font-medium">{label}</td>
                  <td className="num font-semibold" style={{ textAlign: 'right' }}>{value}</td>
                  <td style={{ color: 'var(--muted)' }}>{sub}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
