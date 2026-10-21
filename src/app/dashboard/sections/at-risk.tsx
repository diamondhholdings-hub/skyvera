/**
 * At-Risk Accounts Section
 * Display customers with red/yellow health status
 */

import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import Link from 'next/link'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { AlertBox } from '../components/alert-box'
import { Panel, SectionHeading } from '../components/panel'

const right = { textAlign: 'right' as const }

export async function AtRiskSection() {
  const customersResult = await getAllCustomersWithHealth()

  if (!customersResult.success) {
    return (
      <section id="at-risk" style={{ display: 'none' }}>
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Failed to load customer data</p>
      </section>
    )
  }

  const atRiskCustomers = customersResult.value
    .filter((c) => c.healthScore === 'red' || c.healthScore === 'yellow')
    .sort((a, b) => {
      // Red first, then by revenue
      if (a.healthScore === 'red' && b.healthScore !== 'red') return -1
      if (a.healthScore !== 'red' && b.healthScore === 'red') return 1
      return (b.rr + b.nrr) - (a.rr + a.nrr)
    })

  const totalAtRiskARR = atRiskCustomers.reduce((sum, c) => sum + c.rr + c.nrr, 0)

  return (
    <section id="at-risk" style={{ display: 'none' }}>
      <SectionHeading title="At-risk accounts" />

      <AlertBox variant="critical">
        <strong>Action needed.</strong> {atRiskCustomers.length} accounts at risk, representing{' '}
        <span className="num">${(totalAtRiskARR / 1e6).toFixed(1)}M</span> in revenue.
      </AlertBox>

      <Panel title="Accounts" description="Critical first, then by revenue" flush>
        <div className="relative overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={right}>Priority</th>
                <th>Customer</th>
                <th>BU</th>
                <th style={right}>Revenue at risk</th>
                <th>Health</th>
                <th>Risk factors</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers.map((customer, index) => {
                const arr = customer.rr + customer.nrr
                const href = `/accounts/${encodeURIComponent(customer.customer_name)}`

                return (
                  <tr key={customer.customer_name}>
                    <td className="num" style={{ ...right, color: 'var(--muted)' }}>{index + 1}</td>
                    <td>
                      <Link href={href} className="font-medium hover:underline" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>
                        {customer.customer_name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--ink-2)' }}>{customer.bu}</td>
                    <td className="num font-medium" style={right}>${(arr / 1e6).toFixed(2)}M</td>
                    <td>
                      <HealthIndicator
                        score={customer.healthScore === 'red' ? 'red' : 'yellow'}
                        label={customer.healthScore === 'red' ? 'Critical' : 'At risk'}
                      />
                    </td>
                    <td style={{ color: 'var(--ink-2)' }}>
                      {customer.healthScore === 'red' ? 'Payment delays, declining usage' : 'Some concerns'}
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
