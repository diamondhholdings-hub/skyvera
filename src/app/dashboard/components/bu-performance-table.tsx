'use client'

/**
 * BU Performance Table
 * Hover via `.data-table` row styles (globals.css).
 * Rows navigate to the accounts list filtered to that BU.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BUFinancialSummary } from '@/lib/types/financial'

interface BUPerformanceTableProps {
  buSummaries: BUFinancialSummary[]
}

const right = { textAlign: 'right' as const }

export function BUPerformanceTable({ buSummaries }: BUPerformanceTableProps) {
  const router = useRouter()
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Business unit</th>
            <th style={right}>Revenue</th>
            <th style={right}>Customers</th>
            <th style={right}>Net margin</th>
            <th style={right}>Target</th>
            <th style={right}>Delta</th>
          </tr>
        </thead>
        <tbody>
          {buSummaries.map((bu) => {
            const delta = bu.ebitda - (bu.totalRevenue * bu.netMarginTarget) / 100
            const href = `/accounts?bu=${encodeURIComponent(bu.bu)}`

            return (
              <tr key={bu.bu} onClick={() => router.push(href)} style={{ cursor: 'pointer' }}>
                <td className="font-medium">
                  <Link
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'var(--secondary)', textDecoration: 'none' }}
                    className="hover:underline"
                  >
                    {bu.bu}
                  </Link>
                </td>
                <td className="num" style={right}>${(bu.totalRevenue / 1e6).toFixed(2)}M</td>
                <td className="num" style={right}>{bu.customerCount}</td>
                <td className="num font-medium" style={right}>{bu.netMarginPct.toFixed(1)}%</td>
                <td className="num" style={{ ...right, color: 'var(--muted)' }}>{bu.netMarginTarget.toFixed(1)}%</td>
                <td className="num font-medium" style={{ ...right, color: delta < 0 ? 'var(--critical-ink)' : 'var(--success-ink)' }}>
                  {delta < 0 ? '-' : '+'}${Math.abs(delta / 1e3).toFixed(0)}K
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
