/**
 * Account Plan Page - Individual customer account details with 7-tab navigation
 * Server Component - fetches account plan data and customer financials
 * URL format: /accounts/[encoded-name]?tab=overview
 * Next.js 16: params and searchParams are Promises
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccountPlanData, getAccountRetentionStrategy } from '@/lib/data/server/account-plan-data'
import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import { TabNavigation } from './_components/tab-navigation'
import { OverviewTab } from './_components/overview-tab'
import { FinancialsTab } from './_components/financials-tab'
import { StrategyTab } from './_components/strategy-tab'
import { CompetitiveTab } from './_components/competitive-tab'
import { OrganizationTab } from './_components/organization-tab'
import { IntelligenceTab } from './_components/intelligence-tab'
import { ActionItemsTab } from './_components/action-items-tab'
import { RetentionTab } from './_components/retention-tab'
import { Badge } from '@/components/ui/badge'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { RefreshButton } from '@/components/ui/refresh-button'

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

  // Fetch retention strategy (will need customer data first)
  let retentionStrategy = null

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

  // Calculate total revenue
  const totalRevenue = (customer.rr || 0) + (customer.nrr || 0)
  const arr = (customer.rr || 0) * 4

  // Fetch retention strategy now that we have customer data
  const retentionStrategyResult = await getAccountRetentionStrategy(customerName, {
    healthScore: customer.healthScore,
    renewalDate: undefined, // TODO: Add renewal date to customer data
    painPoints: accountData.strategy.painPoints,
    competitors: accountData.competitors,
  })

  if (retentionStrategyResult.success) {
    retentionStrategy = retentionStrategyResult.value
  }

  return (
    <div>
      {/* Back link */}
      <div className="max-w-[1400px] mx-auto px-8 pt-4">
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-accent hover:text-accent/80 hover:underline"
        >
          ← Back to Accounts
        </Link>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-secondary to-[#1a2332] text-paper px-8 pt-12 pb-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="font-display text-4xl font-light text-paper mb-2">
                {customer.customer_name}
              </h1>
              <div className="flex items-center gap-3 text-paper/80 text-lg">
                <span>Strategic Account Plan</span>
                <span>|</span>
                <Badge variant="default">{customer.bu} Business Unit</Badge>
                <span>|</span>
                <HealthIndicator score={customer.healthScore} />
                <span>|</span>
                <span>Q1 2026</span>
              </div>
            </div>
            <RefreshButton label="Refresh Data" />
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-white/10 p-5 rounded border border-white/10">
              <div className="text-xs uppercase tracking-wider text-paper/70 mb-2">
                Total Revenue
              </div>
              <div className="text-2xl font-display font-semibold text-paper">
                ${totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 p-5 rounded border border-white/10">
              <div className="text-xs uppercase tracking-wider text-paper/70 mb-2">
                Recurring Revenue
              </div>
              <div className="text-2xl font-display font-semibold text-paper">
                ${(customer.rr || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 p-5 rounded border border-white/10">
              <div className="text-xs uppercase tracking-wider text-paper/70 mb-2">
                Non-Recurring Revenue
              </div>
              <div className="text-2xl font-display font-semibold text-paper">
                ${(customer.nrr || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 p-5 rounded border border-white/10">
              <div className="text-xs uppercase tracking-wider text-paper/70 mb-2">
                Health Score
              </div>
              <div className="text-2xl font-display font-semibold text-paper">
                {customer.healthScore}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation accountName={name} />

      {/* Tab Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-6">
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
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationTab stakeholders={accountData.stakeholders} />
          </Suspense>
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
          <Suspense fallback={<TabSkeleton />}>
            <IntelligenceTab
              intelligenceReport={accountData.intelligence}
              news={accountData.news}
              customerName={customerName}
            />
          </Suspense>
        )}

        {activeTab === 'action-items' && (
          <Suspense fallback={<TabSkeleton />}>
            <ActionItemsTab initialActions={accountData.actions} />
          </Suspense>
        )}

        {activeTab === 'retention' && (
          <Suspense fallback={<TabSkeleton />}>
            {retentionStrategy ? (
              <RetentionTab
                retentionStrategy={retentionStrategy}
                accountName={customerName}
                arr={arr}
              />
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <p className="text-slate-600">Unable to load retention strategy data</p>
              </div>
            )}
          </Suspense>
        )}
      </div>
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
