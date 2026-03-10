/**
 * FinancialsTab - Full contract table, charts, strategic impact, expansion opportunities
 * Server Component — chart subcomponents are 'use client'
 */

import { Suspense } from 'react'
import type { CustomerWithHealth } from '@/lib/types/customer'
import { RevenueGrowthChart } from '@/components/charts/revenue-growth-chart'
import { TopCustomersChart } from '@/components/charts/top-customers-chart'

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
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '2px',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: isPositive ? 'var(--success, #4caf50)' : 'var(--critical, #e53935)',
      color: 'white',
    }}>
      {isPositive ? '+' : ''}{pct.toFixed(0)}%
    </span>
  )
}

export function FinancialsTab({ customer, allBuCustomers = [] }: FinancialsTabProps) {
  const totalCurrentARR = customer.subscriptions.reduce((sum, s) => sum + (s.arr ?? 0), 0)
  const totalProjectedARR = customer.subscriptions.reduce((sum, s) => sum + (s.projected_arr ?? s.arr ?? 0), 0)
  const rrPercent = customer.total > 0 ? (customer.rr / customer.total) * 100 : 0
  const nrrPercent = customer.total > 0 ? (customer.nrr / customer.total) * 100 : 0

  // Strategic impact figures
  const buTotal = allBuCustomers.reduce((sum, c) => sum + c.rr + c.nrr, 0)
  const buPct = buTotal > 0 ? (((customer.rr + customer.nrr) / buTotal) * 100).toFixed(1) : '—'

  return (
    <div className="space-y-8">

      {/* Metric Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: customer.rr > 0 ? 'ARR' : 'Annual Rev', value: formatCurrency(customer.rr > 0 ? customer.rr : customer.nrr), sub: customer.rr > 0 ? 'Annual Recurring Revenue' : 'Non-Recurring Revenue' },
          { label: 'Recurring Revenue', value: formatCurrency(customer.rr), sub: 'Quarterly recurring' },
          { label: 'Non-Recurring', value: formatCurrency(customer.nrr), sub: 'One-time revenue' },
          { label: 'Total Revenue', value: formatCurrency(customer.total), sub: 'Combined this period' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: 'var(--highlight)', padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.4rem' }}>{label}</div>
            <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2rem', fontWeight: 600, color: 'var(--secondary)' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Contract / Subscription Table */}
      <div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          Contract Summary
        </h2>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <style>{`.sub-row:hover { background: var(--highlight) !important; }`}</style>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                {['Sub ID', 'Start Date', 'End Date', 'Current ARR', 'Projected ARR', 'Growth', 'Renewal', 'Status'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customer.subscriptions.length > 0 ? customer.subscriptions.map((sub, i) => (
                <tr key={i} className="sub-row" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--secondary)' }}>{sub.sub_id ?? '—'}</td>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>{sub.startDate ?? '—'}</td>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>{sub.endDate ?? '—'}</td>
                  <td style={{ padding: '1rem', color: 'var(--ink)' }}>{sub.arr != null ? formatCurrency(sub.arr) : '—'}</td>
                  <td style={{ padding: '1rem', color: 'var(--ink)' }}>{sub.projected_arr != null ? formatCurrency(sub.projected_arr) : '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    {sub.arr && sub.projected_arr
                      ? <BadgeGrowth current={sub.arr} projected={sub.projected_arr} />
                      : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>{sub.renewal_qtr ?? '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '2px',
                      fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: sub.will_renew === 'Yes' ? 'var(--success, #4caf50)' : sub.will_renew?.startsWith('No') ? 'var(--critical, #e53935)' : 'var(--warning, #ff9800)',
                      color: 'white',
                    }}>
                      {sub.will_renew ?? 'TBD'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>No subscription data</td></tr>
              )}
            </tbody>
            {customer.subscriptions.length > 1 && (
              <tfoot>
                <tr style={{ background: 'var(--highlight)', fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>TOTAL</td>
                  <td style={{ padding: '1rem', color: 'var(--secondary)' }}><strong>{formatCurrency(totalCurrentARR)}</strong></td>
                  <td style={{ padding: '1rem', color: 'var(--secondary)' }}><strong>{formatCurrency(totalProjectedARR)}</strong></td>
                  <td style={{ padding: '1rem' }}><BadgeGrowth current={totalCurrentARR} projected={totalProjectedARR} /></td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Revenue Breakdown bar */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>Revenue Breakdown</h2>
        <div style={{ display: 'flex', height: '2rem', borderRadius: 0, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
          {rrPercent > 0 && (
            <div style={{ width: `${rrPercent}%`, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 500 }}>
              {rrPercent > 10 && `${rrPercent.toFixed(0)}%`}
            </div>
          )}
          {nrrPercent > 0 && (
            <div style={{ width: `${nrrPercent}%`, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 500 }}>
              {nrrPercent > 10 && `${nrrPercent.toFixed(0)}%`}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'var(--accent)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Recurring Revenue: {formatCurrency(customer.rr)}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{rrPercent.toFixed(1)}% of total</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'var(--secondary)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Non-Recurring: {formatCurrency(customer.nrr)}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{nrrPercent.toFixed(1)}% of total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>Revenue Growth Projection</h2>
          <Suspense fallback={<div style={{ height: 300, background: 'var(--highlight)', opacity: 0.4 }} />}>
            <RevenueGrowthChart subscriptions={customer.subscriptions} />
          </Suspense>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>Top Customers — {customer.bu}</h2>
          <Suspense fallback={<div style={{ height: 320, background: 'var(--highlight)', opacity: 0.4 }} />}>
            <TopCustomersChart allBuCustomers={allBuCustomers} currentCustomerName={customer.customer_name} />
          </Suspense>
        </div>
      </div>

      {/* Strategic Impact Analysis */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>Strategic Impact Analysis</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { label: 'If Account Churned', value: `-${formatCurrency(Math.round((customer.rr + customer.nrr) / 4))}`, sub: 'Quarterly revenue impact' },
            { label: '% of BU Revenue', value: buPct !== '—' ? `${buPct}%` : '—', sub: `Share of ${customer.bu} total` },
            { label: 'Subscription Count', value: `${customer.subscriptions.length}`, sub: 'Active subscriptions tracked' },
            { label: 'Upsell Potential', value: totalProjectedARR > totalCurrentARR ? `+${formatCurrency(totalProjectedARR - totalCurrentARR)}` : '—', sub: 'If projected ARR executes' },
            { label: 'Health Score', value: customer.healthScore.charAt(0).toUpperCase() + customer.healthScore.slice(1), sub: 'Current account health' },
            { label: 'Rank in BU', value: customer.rank ? `#${customer.rank}` : '—', sub: 'By total revenue' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: 'var(--highlight)', padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.4rem' }}>{label}</div>
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.8rem', fontWeight: 600, color: 'var(--secondary)' }}>{value}</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.3rem' }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
