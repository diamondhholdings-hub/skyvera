/**
 * Customer Summary Section
 * Customer health, concentration, and churn metrics
 */

import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import Link from 'next/link'

export async function CustomerSummarySection() {
  const customersResult = await getAllCustomersWithHealth()

  if (!customersResult.success) {
    return (
      <section id="customer-summary" style={{ display: 'none' }}>
        <p style={{ textAlign: 'center', color: '#64748b' }}>Failed to load customer data</p>
      </section>
    )
  }

  const customers = customersResult.value
  const totalCustomers = customers.length
  const healthCounts = customers.reduce(
    (acc, c) => {
      acc[c.health]++
      return acc
    },
    { green: 0, yellow: 0, red: 0 } as Record<string, number>
  )

  return (
    <section id="customer-summary" style={{ display: 'none' }}>
      <h2 style={{
        fontSize: '1.8em',
        color: '#1e3c72',
        fontWeight: 'semibold',
        margin: '30px 0 20px 0',
        paddingBottom: '10px',
        borderBottom: '3px solid #667eea'
      }}>
        Customer Summary
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        margin: '30px 0'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
        }}>
          <div style={{ fontSize: '0.85em', opacity: 0.9, marginBottom: '10px' }}>Total Customers</div>
          <div style={{ fontSize: '2.3em', fontWeight: 700 }}>{totalCustomers}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
        }}>
          <div style={{ fontSize: '0.85em', opacity: 0.9, marginBottom: '10px' }}>Healthy</div>
          <div style={{ fontSize: '2.3em', fontWeight: 700 }}>{healthCounts.green}</div>
          <div style={{ fontSize: '0.8em', opacity: 0.85, marginTop: '5px' }}>{((healthCounts.green / totalCustomers) * 100).toFixed(1)}%</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(250, 112, 154, 0.4)'
        }}>
          <div style={{ fontSize: '0.85em', opacity: 0.9, marginBottom: '10px' }}>At Risk</div>
          <div style={{ fontSize: '2.3em', fontWeight: 700 }}>{healthCounts.yellow}</div>
          <div style={{ fontSize: '0.8em', opacity: 0.85, marginTop: '5px' }}>{((healthCounts.yellow / totalCustomers) * 100).toFixed(1)}%</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)'
        }}>
          <div style={{ fontSize: '0.85em', opacity: 0.9, marginBottom: '10px' }}>Critical</div>
          <div style={{ fontSize: '2.3em', fontWeight: 700 }}>{healthCounts.red}</div>
          <div style={{ fontSize: '0.8em', opacity: 0.85, marginTop: '5px' }}>{((healthCounts.red / totalCustomers) * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <Link
          href="/accounts"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#667eea',
            color: 'white',
            borderRadius: '8px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#764ba2'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
        >
          View All Accounts →
        </Link>
      </div>
    </section>
  )
}
