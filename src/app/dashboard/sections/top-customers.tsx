/**
 * Top Customers Section
 * Display top revenue generating customers
 */

import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import Link from 'next/link'

export async function TopCustomersSection() {
  const customersResult = await getAllCustomersWithHealth()

  if (!customersResult.success) {
    return (
      <section id="top-customers" style={{ display: 'none' }}>
        <p style={{ textAlign: 'center', color: '#64748b' }}>Failed to load customer data</p>
      </section>
    )
  }

  const topCustomers = customersResult.value
    .sort((a, b) => (b.rr + b.nrr) - (a.rr + a.nrr))
    .slice(0, 20)

  return (
    <section id="top-customers" style={{ display: 'none' }}>
      <h2 style={{ fontSize: '1.875rem', fontWeight: '600', color: '#1e3c72', marginBottom: '1.25rem', paddingBottom: '0.625rem', borderBottom: '3px solid #667eea' }}>
        Top 20 Customers by Revenue
      </h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', margin: '1.25rem 0' }}>
        <thead>
          <tr style={{ backgroundColor: '#1e3c72', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem' }}>Rank</th>
            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem' }}>Customer</th>
            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem' }}>BU</th>
            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem' }}>Total Revenue</th>
            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem' }}>RR</th>
            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem' }}>NRR</th>
            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem' }}>Health</th>
            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.875rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ backgroundColor: 'white' }}>
          {topCustomers.map((customer, index) => {
            const total = customer.rr + customer.nrr
            const healthColor =
              customer.healthScore === 'green'
                ? '#22c55e'
                : customer.healthScore === 'yellow'
                  ? '#f59e0b'
                  : '#ef4444'

            return (
              <tr key={`${customer.customer_name}-${index}`} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.15s ease-in-out' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600' }}>{index + 1}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  <Link
                    href={`/accounts/${encodeURIComponent(customer.customer_name)}`}
                    style={{ color: '#667eea', fontWeight: '500', textDecoration: 'none', transition: 'color 0.15s ease-in-out' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#764ba2'; e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#667eea'; e.currentTarget.style.textDecoration = 'none' }}
                  >
                    {customer.customer_name}
                  </Link>
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{customer.bu}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600' }}>${(total / 1e6).toFixed(2)}M</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>${(customer.rr / 1e6).toFixed(2)}M</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>${(customer.nrr / 1e6).toFixed(2)}M</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  <span
                    style={{ display: 'inline-block', width: '0.75rem', height: '0.75rem', borderRadius: '9999px', backgroundColor: healthColor }}
                    aria-label={customer.healthScore}
                  />
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  <Link
                    href={`/accounts/${encodeURIComponent(customer.customer_name)}`}
                    style={{ color: '#667eea', fontSize: '0.75rem', fontWeight: '500', textDecoration: 'none', transition: 'color 0.15s ease-in-out' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#764ba2' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#667eea' }}
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
