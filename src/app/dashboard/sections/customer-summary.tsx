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
        <p className="text-center text-slate-500">Failed to load customer data</p>
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
      <h2 className="text-3xl font-semibold text-[#1e3c72] mb-5 pb-2.5 border-b-[3px] border-[#667eea]">
        Customer Summary
      </h2>

      <div className="grid grid-cols-4 gap-5 my-8">
        <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-6 rounded-2xl">
          <div className="text-sm opacity-90 mb-2">Total Customers</div>
          <div className="text-4xl font-bold">{totalCustomers}</div>
        </div>
        <div className="bg-gradient-to-br from-[#4facfe] to-[#00f2fe] text-white p-6 rounded-2xl">
          <div className="text-sm opacity-90 mb-2">Healthy</div>
          <div className="text-4xl font-bold">{healthCounts.green}</div>
          <div className="text-xs opacity-85 mt-1">{((healthCounts.green / totalCustomers) * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-gradient-to-br from-[#fa709a] to-[#fee140] text-white p-6 rounded-2xl">
          <div className="text-sm opacity-90 mb-2">At Risk</div>
          <div className="text-4xl font-bold">{healthCounts.yellow}</div>
          <div className="text-xs opacity-85 mt-1">{((healthCounts.yellow / totalCustomers) * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-gradient-to-br from-[#f093fb] to-[#f5576c] text-white p-6 rounded-2xl">
          <div className="text-sm opacity-90 mb-2">Critical</div>
          <div className="text-4xl font-bold">{healthCounts.red}</div>
          <div className="text-xs opacity-85 mt-1">{((healthCounts.red / totalCustomers) * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link
          href="/accounts"
          className="inline-block px-6 py-3 bg-[#667eea] hover:bg-[#764ba2] text-white rounded-lg font-semibold transition-colors"
        >
          View All Accounts →
        </Link>
      </div>
    </section>
  )
}
