/**
 * OverviewTab - Telstra-style overview with charts, alert, priorities, account status, risk summary
 * Server Component — chart subcomponents are 'use client' wrapped in Suspense
 */

import { Suspense } from 'react'
import type { CustomerWithHealth } from '@/lib/types/customer'
import type { PainPoint, Opportunity } from '@/lib/types/account-plan'
import { AlertTriangle, TrendingUp, TrendingDown, Shield } from 'lucide-react'
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

const priorityLabels = ['#1 Priority', '#2 Priority', '#3 Priority']

export function OverviewTab({
  customer,
  painPoints = [],
  opportunities = [],
  allBuCustomers = [],
}: OverviewTabProps) {
  const arr = customer.rr + customer.nrr
  const hasAlert = customer.healthScore === 'red' || customer.healthScore === 'yellow'
  const topPainPoints = painPoints.slice(0, 3)
  const topOpportunities = opportunities.slice(0, 3)

  const defaultPriorities = [
    { label: '#1 Priority', title: 'Strengthen Executive Engagement' },
    {
      label: '#2 Priority',
      title: customer.subscriptions.length > 0
        ? `Secure ${customer.subscriptions.length} Subscription Renewal${customer.subscriptions.length > 1 ? 's' : ''}`
        : 'Identify Expansion Opportunities',
    },
    { label: '#3 Priority', title: 'Execute Upsell Strategy' },
  ]

  const priorities = topPainPoints.length >= 3
    ? topPainPoints.map((pp, i) => ({ label: priorityLabels[i], title: pp.title }))
    : defaultPriorities

  return (
    <div className="space-y-8">

      {/* Critical Alert Banner */}
      {hasAlert && (
        <div style={{
          background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
          color: 'white',
          padding: '1.5rem 2rem',
          marginBottom: '1rem',
          borderLeft: '4px solid #8b1a1a',
          boxShadow: '0 4px 12px rgba(197,75,49,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} />
            {customer.healthScore === 'red' ? '🚨 ACCOUNT AT RISK — IMMEDIATE ACTION REQUIRED' : '⚠️ ACCOUNT RISK ALERT'}
          </div>
          <p style={{ opacity: 0.9, fontSize: '0.9rem', lineHeight: 1.6 }}>
            {customer.healthScore === 'red'
              ? 'This account requires immediate executive attention. Review risk factors below and escalate to account leadership.'
              : 'This account shows moderate-risk indicators requiring proactive management.'}
            {customer.healthFactors.length > 0 && ` Key concerns: ${customer.healthFactors.slice(0, 2).join(', ')}.`}
          </p>
        </div>
      )}

      {/* Keys to Success — 3 metric boxes */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
          Keys to Success in Next 90 Days
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {priorities.map(({ label, title }) => (
            <div key={label} style={{ background: 'var(--highlight)', padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                {label}
              </div>
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', fontWeight: 600, color: 'var(--secondary)', lineHeight: 1.3 }}>
                {title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-col: Account Status + Risk & Opportunity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        {/* Account Status */}
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>Account Status</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <tbody>
              {[
                { label: 'Customer', value: customer.customer_name },
                { label: 'Business Unit', value: customer.bu },
                { label: 'Rank', value: customer.rank ? `#${customer.rank}` : '—' },
                { label: customer.rr > 0 ? 'ARR' : 'Annual Rev', value: formatCurrency(arr) },
                { label: 'Health Score', value: customer.healthScore.charAt(0).toUpperCase() + customer.healthScore.slice(1) },
                { label: '% of Revenue', value: customer.pct_of_total != null ? `${customer.pct_of_total.toFixed(2)}%` : '—' },
              ].map(({ label, value }) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem 0.75rem 0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 600, width: '9rem' }}>
                    {label}
                  </td>
                  <td style={{ padding: '0.75rem 0', color: 'var(--ink)', fontWeight: 500 }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Risk & Opportunity Summary */}
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>Risk & Opportunity Summary</h2>
          {painPoints.length > 0 && (
            <>
              <h3 style={{ color: 'var(--critical, #e53935)', fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Top Risks</h3>
              <ul style={{ marginLeft: '1.25rem', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.8 }}>
                {painPoints.slice(0, 3).map(pp => (
                  <li key={pp.id}><strong>{pp.title}:</strong> {pp.description?.slice(0, 80)}{pp.description?.length > 80 ? '…' : ''}</li>
                ))}
              </ul>
            </>
          )}
          {topOpportunities.length > 0 && (
            <>
              <h3 style={{ color: 'var(--success, #4caf50)', fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Top Opportunities</h3>
              <ul style={{ marginLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.8 }}>
                {topOpportunities.map(opp => (
                  <li key={opp.id}>
                    <strong>{opp.title}{opp.estimatedValue ? ` (+${formatCurrency(opp.estimatedValue)})` : ''}:</strong>{' '}
                    {opp.description?.slice(0, 80)}{opp.description?.length > 80 ? '…' : ''}
                  </li>
                ))}
              </ul>
            </>
          )}
          {painPoints.length === 0 && opportunities.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No risk or opportunity data available yet.</p>
          )}
        </div>
      </div>

      {/* 2-col charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>ARR Breakdown</h2>
          <Suspense fallback={<div style={{ height: 300, background: 'var(--highlight)', opacity: 0.4 }} />}>
            <ARRBreakdownChart rr={customer.rr} nrr={customer.nrr} />
          </Suspense>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>Top Customers — {customer.bu}</h2>
          <Suspense fallback={<div style={{ height: 320, background: 'var(--highlight)', opacity: 0.4 }} />}>
            <TopCustomersChart allBuCustomers={allBuCustomers} currentCustomerName={customer.customer_name} />
          </Suspense>
        </div>
      </div>

    </div>
  )
}
