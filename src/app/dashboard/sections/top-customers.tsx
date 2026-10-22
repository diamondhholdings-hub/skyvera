/**
 * Top Customers Section
 * Display top revenue generating customers
 */

import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import Link from 'next/link'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { Panel, SectionHeading } from '../components/panel'

const right = { textAlign: 'right' as const }

export async function TopCustomersSection() {
  const customersResult = await getAllCustomersWithHealth()

  if (!customersResult.success) {
    return (
      <section id="top-customers" style={{ display: 'none' }}>
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Failed to load customer data</p>
      </section>
    )
  }

  const topCustomers = customersResult.value
    .sort((a, b) => (b.rr + b.nrr) - (a.rr + a.nrr))
    .slice(0, 20)

  return (
    <section id="top-customers" style={{ display: 'none' }}>
      <SectionHeading title="Top 20 customers by revenue" />

      <Panel title="Customers" description="Ranked by total revenue (RR + NRR)" flush>
        <div className="relative overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={right}>Rank</th>
                <th>Customer</th>
                <th>BU</th>
                <th style={right}>Total revenue</th>
                <th style={right}>RR</th>
                <th style={right}>NRR</th>
                <th>Health</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((customer, index) => {
                const total = customer.rr + customer.nrr
                const href = `/accounts/${encodeURIComponent(customer.customer_name)}`

                return (
                  <tr key={`${customer.customer_name}-${index}`}>
                    <td className="num" style={{ ...right, color: 'var(--muted)' }}>{index + 1}</td>
                    <td>
                      <Link href={href} className="font-medium hover:underline" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>
                        {customer.customer_name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--ink-2)' }}>{customer.bu}</td>
                    <td className="num font-medium" style={right}>${(total / 1e6).toFixed(2)}M</td>
                    <td className="num" style={right}>${(customer.rr / 1e6).toFixed(2)}M</td>
                    <td className="num" style={right}>${(customer.nrr / 1e6).toFixed(2)}M</td>
                    <td>
                      <HealthIndicator score={customer.healthScore} label={customer.healthScore === 'yellow' ? 'At risk' : undefined} />
                    </td>
                    <td style={right}>
                      <Link href={href} className="btn btn-ghost btn-sm">
                        View plan
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  )
}
