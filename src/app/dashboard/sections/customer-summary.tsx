/**
 * Customer Summary Section
 * Customer health, concentration, and churn metrics
 */

import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { KpiStrip } from '@/components/ui/kpi-strip'
import { SectionHeading } from '../components/panel'

export async function CustomerSummarySection() {
  const customersResult = await getAllCustomersWithHealth()

  if (!customersResult.success) {
    return (
      <section id="customer-summary" style={{ display: 'none' }}>
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Failed to load customer data</p>
      </section>
    )
  }

  const customers = customersResult.value
  const totalCustomers = customers.length
  const healthCounts = customers.reduce(
    (acc, c) => {
      acc[c.healthScore]++
      return acc
    },
    { green: 0, yellow: 0, red: 0 } as Record<string, number>
  )
  const share = (n: number) => `${((n / totalCustomers) * 100).toFixed(1)}% of customers`

  return (
    <section id="customer-summary" style={{ display: 'none' }}>
      <SectionHeading
        title="Customer summary"
        description="Account health across all business units"
        action={
          <Link href="/accounts" className="btn">
            View all accounts
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      />

      <KpiStrip
        items={[
          { label: 'Total customers', value: totalCustomers },
          { label: 'Healthy', value: healthCounts.green, context: share(healthCounts.green), tone: 'success' },
          { label: 'At risk', value: healthCounts.yellow, context: share(healthCounts.yellow), tone: 'warning' },
          { label: 'Critical', value: healthCounts.red, context: share(healthCounts.red), tone: 'critical' },
        ]}
      />
    </section>
  )
}
