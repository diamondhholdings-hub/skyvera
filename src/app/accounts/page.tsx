/**
 * Accounts Page - Customer directory with search, filtering, health scoring
 * Server Component - fetches data directly from account-data.ts
 * Satisfies requirements ACCT-01, ACCT-02, ACCT-03
 */

import { getAllCustomersWithHealth, getCustomerCount } from '@/lib/data/server/account-data'
import { getCompletenessScores } from '@/lib/data/server/account-plan-data'
import { RefreshButton } from '@/components/ui/refresh-button'
import { ExportButton } from '@/components/ui/export-button'
import { AccountStats } from './components/account-stats'
import { AccountTable } from './components/account-table'
import { AccountsSearch } from '@/components/accounts-search'
import { PageHeader } from '@/components/ui/page-header'
import { Suspense } from 'react'
import { CircleAlert } from 'lucide-react'

export const metadata = {
  title: 'Customer Accounts - Skyvera',
  description: 'Browse all customers with health scores and financial metrics',
}

// Loading skeleton component
function TableSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-9" style={{ borderRadius: 0 }} />
      <div className="space-y-px p-0">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

function LoadError({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
      <div className="alert-box alert-critical flex items-start gap-3" role="alert">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <h1 className="m-0 text-base font-semibold" style={{ color: 'inherit' }}>{title}</h1>
          <p className="m-0 mt-1 text-sm">{message}</p>
        </div>
      </div>
    </div>
  )
}

interface AccountsPageProps {
  searchParams: Promise<{ search?: string; bu?: string; health?: string }>
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const { search, bu } = await searchParams

  // Fetch customers and stats
  const [customersResult, statsResult] = await Promise.all([
    getAllCustomersWithHealth(),
    getCustomerCount(),
  ])

  // Handle errors
  if (!customersResult.success) {
    return <LoadError title="Unable to load customer data" message={customersResult.error.message} />
  }

  if (!statsResult.success) {
    return <LoadError title="Unable to load statistics" message={statsResult.error.message} />
  }

  const customers = customersResult.value
  const stats = statsResult.value

  // Apply server-side BU filter (supports bookmarkable URLs, e.g. from the
  // dashboard's BU performance table)
  const byBU = bu ? customers.filter((c) => c.bu.toLowerCase() === bu.toLowerCase()) : customers

  // Apply server-side search filter (supports bookmarkable URLs)
  const searchQuery = search?.toLowerCase().trim() ?? ''
  const filtered = searchQuery
    ? byBU.filter(
        (c) =>
          c.customer_name.toLowerCase().includes(searchQuery) ||
          c.bu.toLowerCase().includes(searchQuery) ||
          c.healthScore.toLowerCase().includes(searchQuery)
      )
    : byBU

  // Fetch completeness scores for filtered accounts in parallel
  const scores = await getCompletenessScores(filtered.map((c) => c.customer_name))

  // Compute total revenue from all customer totals
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total || 0), 0)

  const subtitle = [
    bu ? `${bu} business unit` : 'All business units',
    `${filtered.length} of ${customers.length} customers`,
    searchQuery ? `matching "${search?.trim()}"` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div>
      <PageHeader
        title="Customer Account Plans"
        subtitle={subtitle}
        action={
          <>
            <ExportButton />
            <RefreshButton />
          </>
        }
      >
        <AccountStats stats={stats} totalRevenue={totalRevenue} />
      </PageHeader>

      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        {/* URL-driven search (?search=), server-side filtered. Suspense because it uses useSearchParams() */}
        <div className="mb-4 max-w-md">
          <Suspense fallback={<div className="skeleton h-9" />}>
            <AccountsSearch />
          </Suspense>
        </div>

        <Suspense fallback={<TableSkeleton />}>
          <AccountTable customers={filtered} completenessScores={scores} />
        </Suspense>
      </div>
    </div>
  )
}
