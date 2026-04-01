/**
 * Accounts Page - Customer directory with search, filtering, health scoring
 * Server Component - fetches data directly from account-data.ts
 * Satisfies requirements ACCT-01, ACCT-02, ACCT-03
 */

import { getAllCustomersWithHealth, getCustomerCount } from '@/lib/data/server/account-data'
import { getCompletenessScores } from '@/lib/data/server/account-plan-data'
import { RefreshButton } from '@/components/ui/refresh-button'
import { AccountStats } from './components/account-stats'
import { AccountTable } from './components/account-table'
import { AccountsSearch } from '@/components/accounts-search'
import { PageHeader } from '@/components/ui/page-header'
import { Suspense } from 'react'

export const metadata = {
  title: 'Customer Accounts - Skyvera',
  description: 'Browse all customers with health scores and financial metrics',
}

// Loading skeleton component
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 rounded mb-4" style={{ background: 'var(--border)' }}></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded" style={{ background: 'var(--surface-2)' }}></div>
        ))}
      </div>
    </div>
  )
}

interface AccountsPageProps {
  searchParams: Promise<{ search?: string; bu?: string; health?: string }>
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const { search } = await searchParams

  // Fetch customers and stats
  const [customersResult, statsResult] = await Promise.all([
    getAllCustomersWithHealth(),
    getCustomerCount(),
  ])

  // Handle errors
  if (!customersResult.success) {
    return (
      <div className="p-6">
        <div
          style={{
            background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderLeft: '4px solid var(--critical)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--critical)', margin: '0 0 0.5rem' }}>
            Unable to load customer data
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>
            {customersResult.error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!statsResult.success) {
    return (
      <div className="p-6">
        <div
          style={{
            background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderLeft: '4px solid var(--critical)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--critical)', margin: '0 0 0.5rem' }}>
            Unable to load statistics
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>
            {statsResult.error.message}
          </p>
        </div>
      </div>
    )
  }

  const customers = customersResult.value
  const stats = statsResult.value

  // Apply server-side search filter (supports bookmarkable URLs)
  const searchQuery = search?.toLowerCase().trim() ?? ''
  const filtered = searchQuery
    ? customers.filter(
        (c) =>
          c.customer_name.toLowerCase().includes(searchQuery) ||
          c.bu.toLowerCase().includes(searchQuery) ||
          c.healthScore.toLowerCase().includes(searchQuery)
      )
    : customers

  // Fetch completeness scores for filtered accounts in parallel
  const scores = await getCompletenessScores(filtered.map((c) => c.customer_name))

  // Compute total revenue from all customer totals
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total || 0), 0)

  return (
    <div>
      {/* Gradient Header */}
      <PageHeader
        title="Customer Account Plans"
        subtitle="CloudSense Business Unit · Q1 2026 Strategic Analysis"
        action={<RefreshButton />}
        centered
      >
        <AccountStats stats={stats} totalRevenue={totalRevenue} />
      </PageHeader>

      {/* Content Container */}
      <div className="max-w-[1400px] mx-auto py-8 px-8">
        {/* Search bar — needs Suspense because it uses useSearchParams() */}
        <div style={{ marginBottom: '20px' }}>
          <Suspense fallback={null}>
            <AccountsSearch />
          </Suspense>
        </div>

        {/* Customer Table */}
        <Suspense fallback={<TableSkeleton />}>
          <AccountTable customers={filtered} completenessScores={scores} />
        </Suspense>
      </div>
    </div>
  )
}
