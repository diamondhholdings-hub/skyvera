/**
 * At-Risk Accounts Section
 * Display customers with red/yellow health status
 */

import { getAllCustomersWithHealth } from '@/lib/data/server/customer-data'
import Link from 'next/link'

export async function AtRiskSection() {
  const customersResult = await getAllCustomersWithHealth()

  if (!customersResult.success) {
    return (
      <section id="at-risk" style={{ display: 'none' }}>
        <p className="text-center text-slate-500">Failed to load customer data</p>
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
      <h2 className="text-3xl font-semibold text-[#1e3c72] mb-5 pb-2.5 border-b-[3px] border-[#667eea]">
        At-Risk Accounts
      </h2>

      <div className="bg-[#ffe5e5] border-l-[5px] border-[#f5576c] text-[#c92a2a] p-5 rounded-lg my-5 font-medium">
        <strong>IMMEDIATE ACTION REQUIRED:</strong> {atRiskCustomers.length} accounts at risk
        representing ${(totalAtRiskARR / 1e6).toFixed(1)}M in ARR
      </div>

      <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm my-5">
        <thead>
          <tr className="bg-[#1e3c72] text-white text-left">
            <th className="p-4 font-semibold text-sm">Priority</th>
            <th className="p-4 font-semibold text-sm">Customer</th>
            <th className="p-4 font-semibold text-sm">BU</th>
            <th className="p-4 font-semibold text-sm">ARR at Risk</th>
            <th className="p-4 font-semibold text-sm">Health</th>
            <th className="p-4 font-semibold text-sm">Risk Factors</th>
            <th className="p-4 font-semibold text-sm">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {atRiskCustomers.map((customer, index) => {
            const arr = customer.rr * 4
            const healthColor = customer.health === 'red' ? 'bg-red-500' : 'bg-amber-500'
            const healthLabel = customer.health === 'red' ? 'CRITICAL' : 'AT RISK'

            return (
              <tr key={customer.name} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="p-3 text-sm font-bold text-[#f5576c]">{index + 1}</td>
                <td className="p-3 text-sm">
                  <Link
                    href={`/accounts/${encodeURIComponent(customer.name)}`}
                    className="text-[#667eea] hover:text-[#764ba2] font-medium hover:underline"
                  >
                    {customer.name}
                  </Link>
                </td>
                <td className="p-3 text-sm">{customer.bu}</td>
                <td className="p-3 text-sm font-semibold">${(arr / 1e6).toFixed(2)}M</td>
                <td className="p-3 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded-2xl text-white text-xs font-semibold ${healthColor}`}
                  >
                    {healthLabel}
                  </span>
                </td>
                <td className="p-3 text-sm text-slate-600">
                  {customer.health === 'red' ? 'Payment delays, declining usage' : 'Some concerns'}
                </td>
                <td className="p-3 text-sm">
                  <Link
                    href={`/accounts/${encodeURIComponent(customer.name)}`}
                    className="text-[#667eea] hover:text-[#764ba2] text-xs font-medium"
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
