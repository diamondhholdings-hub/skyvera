'use client'

/**
 * BU Performance Table
 * Exact match to reference HTML styling
 */

import type { BUFinancialSummary } from '@/lib/types/financial'

interface BUPerformanceTableProps {
  buSummaries: BUFinancialSummary[]
}

export function BUPerformanceTable({ buSummaries }: BUPerformanceTableProps) {
  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      margin: '20px 0',
      background: 'white',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <thead>
        <tr style={{ background: '#1e3c72', color: 'white', textAlign: 'left' as const }}>
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

          return (
            <tr
              key={bu.bu}
              style={{ borderBottom: '1px solid #e9ecef', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '12px 15px', fontSize: '0.9em', fontWeight: 600 }}>
                {bu.bu}
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
                  background: delta < 0 ? '#f5576c' : '#4facfe',
                  color: 'white'
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
