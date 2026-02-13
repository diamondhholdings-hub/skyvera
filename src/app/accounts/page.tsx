/**
 * Accounts Page - Customer directory with search, filtering, health scoring
 * Server Component - fetches data directly from account-data.ts
 * Satisfies requirements ACCT-01, ACCT-02, ACCT-03
 */

import { getAllCustomersWithHealth, getCustomerCount } from '@/lib/data/server/account-data'
import { RefreshButton } from '@/components/ui/refresh-button'
import { AccountStats } from './components/account-stats'
import { AccountTable } from './components/account-table'
import { Suspense } from 'react'

export const metadata = {
  title: 'Customer Accounts - Skyvera',
  description: 'Browse all customers with health scores and financial metrics',
}

// Loading skeleton component
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  )
}

export default async function AccountsPage() {
  // Fetch customers and stats
  const [customersResult, statsResult] = await Promise.all([
    getAllCustomersWithHealth(),
    getCustomerCount(),
  ])

  // Handle errors
  if (!customersResult.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Unable to load customer data</h2>
          <p className="text-sm text-red-600 mt-2">
            {customersResult.error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!statsResult.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Unable to load statistics</h2>
          <p className="text-sm text-red-600 mt-2">
            {statsResult.error.message}
          </p>
        </div>
      </div>
    )
  }

  const customers = customersResult.value
  const stats = statsResult.value
  const lastUpdated = new Date()

  return (
    <div>
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-secondary to-[#1a2332] text-paper pt-16 pb-12 px-8 text-center relative">
        <div className="absolute top-4 right-4">
          <RefreshButton />
        </div>
        <h1 className="font-display text-4xl font-light text-paper">
          Skyvera Customer Account Plans
        </h1>
        <p className="text-paper/80 text-lg mt-3">
          CloudSense Business Unit | Q1 2026 Strategic Analysis
        </p>

        {/* Stats Summary inside header */}
        <AccountStats stats={stats} />
      </div>

      {/* Content Container */}
      <div className="max-w-[1400px] mx-auto py-8 px-8">
        {/* Customer Table */}
        <Suspense fallback={<TableSkeleton />}>
          <AccountTable customers={customers} />
        </Suspense>

        {/* Debug info - remove after fixing */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <p><strong>Debug:</strong> Loaded {customers.length} customers at {lastUpdated.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  )
}
