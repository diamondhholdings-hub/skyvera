/**
 * Account Plan Page - Individual customer account details with 7-tab navigation
 * Server Component - fetches account plan data and customer financials
 * URL format: /accounts/[encoded-name]?tab=overview
 * Next.js 16: params and searchParams are Promises
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccountPlanData } from '@/lib/data/server/account-plan-data'
import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import { TabNavigation } from './_components/tab-navigation'
import { OverviewTab } from './_components/overview-tab'
import { FinancialsTab } from './_components/financials-tab'
import { StrategyTab } from './_components/strategy-tab'
import { CompetitiveTab } from './_components/competitive-tab'
import { Badge } from '@/components/ui/badge'
import { HealthIndicator } from '@/components/ui/health-indicator'

interface AccountPlanPageProps {
  params: Promise<{ name: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: AccountPlanPageProps) {
  const { name } = await params
  const customerName = decodeURIComponent(name)

  return {
    title: `${customerName} - Account Plan`,
    description: `Account plan details for ${customerName}`,
  }
}

export default async function AccountPlanPage({ params, searchParams }: AccountPlanPageProps) {
  // Await params and searchParams (Next.js 16 requirement)
  const { name } = await params
  const { tab } = await searchParams
  const activeTab = tab || 'overview'

  // Decode customer name from URL
  const customerName = decodeURIComponent(name)

  // Fetch account plan data
  const accountDataResult = await getAccountPlanData(customerName)

  if (!accountDataResult.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Unable to load account data</h2>
          <p className="text-sm text-red-600 mt-2">{accountDataResult.error.message}</p>
        </div>
      </div>
    )
  }

  const accountData = accountDataResult.value

  // Fetch customer financial data and health
  const customersResult = await getAllCustomersWithHealth()

  if (!customersResult.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Unable to load customer data</h2>
          <p className="text-sm text-red-600 mt-2">{customersResult.error.message}</p>
        </div>
      </div>
    )
  }

  // Find this specific customer
  const customer = customersResult.value.find(
    (c) => c.customer_name.toLowerCase() === customerName.toLowerCase()
  )

  if (!customer) {
    notFound()
  }

  return (
    <div className="p-6">
      {/* Back link */}
      <Link
        href="/accounts"
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline mb-4"
      >
        ← Back to Accounts
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{customer.customer_name}</h1>
        <div className="flex items-center gap-3">
          <Badge variant="default">{customer.bu}</Badge>
          <HealthIndicator score={customer.healthScore} />
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation accountName={name} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Suspense fallback={<TabSkeleton />}>
          <OverviewTab customer={customer} intelligenceReport={accountData.intelligence.raw} />
        </Suspense>
      )}

      {activeTab === 'financials' && (
        <Suspense fallback={<TabSkeleton />}>
          <FinancialsTab customer={customer} />
        </Suspense>
      )}

      {activeTab === 'organization' && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg font-medium mb-2">Organization Chart</p>
          <p className="text-sm">Coming soon in Plan 04-03</p>
        </div>
      )}

      {activeTab === 'strategy' && (
        <Suspense fallback={<TabSkeleton />}>
          <StrategyTab
            painPoints={accountData.strategy.painPoints}
            opportunities={accountData.strategy.opportunities}
          />
        </Suspense>
      )}

      {activeTab === 'competitive' && (
        <Suspense fallback={<TabSkeleton />}>
          <CompetitiveTab competitors={accountData.competitors} />
        </Suspense>
      )}

      {activeTab === 'intelligence' && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg font-medium mb-2">AI Intelligence Report</p>
          <p className="text-sm">Coming soon in Plan 04-04</p>
        </div>
      )}

      {activeTab === 'action-items' && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg font-medium mb-2">Action Items</p>
          <p className="text-sm">Coming soon in Plan 04-04</p>
        </div>
      )}
    </div>
  )
}

/**
 * Loading skeleton for tab content
 */
function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-lg"></div>
    </div>
  )
}
