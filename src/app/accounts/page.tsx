/**
 * Accounts Page - Customer directory with search, filtering, health scoring
 * Server Component - fetches data directly from account-data.ts
 * Satisfies requirements ACCT-01, ACCT-02, ACCT-03
 */

import { Suspense } from 'react'
import { getAllCustomersWithHealth, getCustomerCount } from '@/lib/data/server/account-data'
import { RefreshButton } from '@/components/ui/refresh-button'
import { AccountStats } from './components/account-stats'
import { AccountTable } from './components/account-table'

export const metadata = {
  title: 'Customer Accounts - Skyvera',
  description: 'Browse all customers with health scores and financial metrics',
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customer Accounts</h1>
          <p className="text-slate-600 mt-2">
            Browse all customers with health scores and financial metrics
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Data as of: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Stats Summary */}
      <AccountStats stats={stats} />

      {/* Customer Table */}
      <Suspense fallback={<TableSkeleton />}>
        <AccountTable customers={customers} />
      </Suspense>
    </div>
  )
}

/**
 * Loading skeleton for table
 */
function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-slate-200 rounded w-full"></div>
        <div className="h-10 bg-slate-100 rounded w-full"></div>
        <div className="h-10 bg-slate-100 rounded w-full"></div>
        <div className="h-10 bg-slate-100 rounded w-full"></div>
        <div className="h-10 bg-slate-100 rounded w-full"></div>
      </div>
    </div>
  )
}
