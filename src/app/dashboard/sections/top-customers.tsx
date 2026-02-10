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
        <p className="text-center text-slate-500">Failed to load customer data</p>
      </section>
    )
  }

  const topCustomers = customersResult.value
    .sort((a, b) => (b.rr + b.nrr) - (a.rr + a.nrr))
    .slice(0, 20)

  return (
    <section id="top-customers" style={{ display: 'none' }}>
      <h2 className="text-3xl font-semibold text-[#1e3c72] mb-5 pb-2.5 border-b-[3px] border-[#667eea]">
        Top 20 Customers by Revenue
      </h2>

      <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm my-5">
        <thead>
          <tr className="bg-[#1e3c72] text-white text-left">
            <th className="p-4 font-semibold text-sm">Rank</th>
            <th className="p-4 font-semibold text-sm">Customer</th>
            <th className="p-4 font-semibold text-sm">BU</th>
            <th className="p-4 font-semibold text-sm">Total Revenue</th>
            <th className="p-4 font-semibold text-sm">RR</th>
            <th className="p-4 font-semibold text-sm">NRR</th>
            <th className="p-4 font-semibold text-sm">Health</th>
            <th className="p-4 font-semibold text-sm">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {topCustomers.map((customer, index) => {
            const total = customer.rr + customer.nrr
            const healthColor =
              customer.health === 'green'
                ? 'bg-green-500'
                : customer.health === 'yellow'
                  ? 'bg-amber-500'
                  : 'bg-red-500'

            return (
              <tr key={customer.name} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="p-3 text-sm font-semibold">{index + 1}</td>
                <td className="p-3 text-sm">
                  <Link
                    href={`/accounts/${encodeURIComponent(customer.name)}`}
                    className="text-[#667eea] hover:text-[#764ba2] font-medium hover:underline"
                  >
                    {customer.name}
                  </Link>
                </td>
                <td className="p-3 text-sm">{customer.bu}</td>
                <td className="p-3 text-sm font-semibold">${(total / 1e6).toFixed(2)}M</td>
                <td className="p-3 text-sm">${(customer.rr / 1e6).toFixed(2)}M</td>
                <td className="p-3 text-sm">${(customer.nrr / 1e6).toFixed(2)}M</td>
                <td className="p-3 text-sm">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${healthColor}`}
                    aria-label={customer.health}
                  />
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
