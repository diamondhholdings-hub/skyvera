'use client'

/**
 * BU Performance Table
 * Hover via CSS `.table-row-hover` (defined in globals.css).
 * Rows navigate to the accounts list filtered to that BU.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BUFinancialSummary } from '@/lib/types/financial'

interface BUPerformanceTableProps {
  buSummaries: BUFinancialSummary[]
}

export function BUPerformanceTable({ buSummaries }: BUPerformanceTableProps) {
  const router = useRouter()
  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      margin: '20px 0',
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <thead>
        <tr style={{ background: 'var(--secondary)', color: 'var(--paper)', textAlign: 'left' as const }}>
          <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Business Unit</th>
          <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Revenue</th>
          <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Customers</th>
          <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Net Margin</th>
          <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Target</th>
          <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Delta</th>
        </tr>
      </thead>
      <tbody>
        {buSummaries.map((bu) => {
          const delta = bu.ebitda - (bu.totalRevenue * bu.netMarginTarget) / 100
          const href = `/accounts?bu=${encodeURIComponent(bu.bu)}`

          return (
            <tr
              key={bu.bu}
              className="table-row-hover"
              onClick={() => router.push(href)}
              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <td style={{ padding: '12px 15px', fontSize: '0.9em', fontWeight: 600 }}>
                <Link
                  href={href}
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                  className="hover:underline"
                >
                  {bu.bu}
                </Link>
              </td>
              <td style={{ padding: '12px 15px', fontSize: '0.9em' }}>
                ${(bu.totalRevenue / 1e6).toFixed(2)}M
              </td>
              <td style={{ padding: '12px 15px', fontSize: '0.9em' }}>
                {bu.customerCount}
              </td>
              <td style={{ padding: '12px 15px', fontSize: '0.9em', fontWeight: 600 }}>
                {bu.netMarginPct.toFixed(1)}%
              </td>
              <td style={{ padding: '12px 15px', fontSize: '0.9em' }}>
                {bu.netMarginTarget.toFixed(1)}%
              </td>
              <td style={{ padding: '12px 15px', fontSize: '0.9em' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '5px 12px',
                  borderRadius: '15px',
                  fontSize: '0.8em',
                  fontWeight: 600,
                  background: delta < 0 ? 'var(--critical)' : 'var(--success)',
                  color: 'var(--paper)'
                }}>
                  {delta < 0 ? '-' : '+'}${Math.abs(delta / 1e3).toFixed(0)}K
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
