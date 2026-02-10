/**
 * At-Risk Accounts Section
 * Display customers with red/yellow health status
 */

import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import Link from 'next/link'

export async function AtRiskSection() {
  const customersResult = await getAllCustomersWithHealth()

  if (!customersResult.success) {
    return (
      <section id="at-risk" style={{ display: 'none' }}>
        <p style={{ textAlign: 'center', color: '#64748b' }}>Failed to load customer data</p>
      </section>
    )
  }

  const atRiskCustomers = customersResult.value
    .filter((c) => c.health === 'red' || c.health === 'yellow')
    .sort((a, b) => {
      // Red first, then by revenue
      if (a.health === 'red' && b.health !== 'red') return -1
      if (a.health !== 'red' && b.health === 'red') return 1
      return (b.rr + b.nrr) - (a.rr + a.nrr)
    })

  const totalAtRiskARR = atRiskCustomers.reduce((sum, c) => sum + c.rr * 4, 0)

  return (
    <section id="at-risk" style={{ display: 'none' }}>
      <h2 style={{
        fontSize: '1.875rem',
        fontWeight: 600,
        color: '#1e3c72',
        marginBottom: '1.25rem',
        paddingBottom: '0.625rem',
        borderBottom: '3px solid #667eea'
      }}>
        At-Risk Accounts
      </h2>

      <div style={{
        backgroundColor: '#ffe5e5',
        borderLeft: '5px solid #f5576c',
        color: '#c92a2a',
        padding: '1.25rem',
        borderRadius: '0.5rem',
        margin: '1.25rem 0',
        fontWeight: 500
      }}>
        <strong>IMMEDIATE ACTION REQUIRED:</strong> {atRiskCustomers.length} accounts at risk
        representing ${(totalAtRiskARR / 1e6).toFixed(1)}M in ARR
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        margin: '1.25rem 0'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#1e3c72', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Priority</th>
            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Customer</th>
            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>BU</th>
            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>ARR at Risk</th>
            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Health</th>
            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Risk Factors</th>
            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: 'white' }}>
          {atRiskCustomers.map((customer, index) => {
            const arr = customer.rr * 4
            const healthBgColor = customer.health === 'red' ? '#ef4444' : '#f59e0b'
            const healthLabel = customer.health === 'red' ? 'CRITICAL' : 'AT RISK'

            return (
              <tr
                key={customer.name}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 700, color: '#f5576c' }}>{index + 1}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  <Link
                    href={`/accounts/${encodeURIComponent(customer.name)}`}
                    style={{
                      color: '#667eea',
                      fontWeight: 500,
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#764ba2'
                      e.currentTarget.style.textDecoration = 'underline'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#667eea'
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                  >
                    {customer.name}
                  </Link>
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{customer.bu}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>${(arr / 1e6).toFixed(2)}M</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      paddingLeft: '0.75rem',
                      paddingRight: '0.75rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      borderRadius: '9999px',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: healthBgColor
                    }}
                  >
                    {healthLabel}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#4b5563' }}>
                  {customer.health === 'red' ? 'Payment delays, declining usage' : 'Some concerns'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  <Link
                    href={`/accounts/${encodeURIComponent(customer.name)}`}
                    style={{
                      color: '#667eea',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#764ba2'
                      e.currentTarget.style.textDecoration = 'underline'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#667eea'
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                  >
                    View Plan →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
