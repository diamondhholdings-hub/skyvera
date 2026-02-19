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
import { OrganizationTab } from './_components/organization-tab'
import { IntelligenceTab } from './_components/intelligence-tab'
import { ActionItemsTab } from './_components/action-items-tab'
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

  // Decode customer name from URL — normalize whitespace after decode
  const customerName = decodeURIComponent(name).replace(/\+/g, ' ')

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

  // Find this specific customer — normalize both sides: decode + lowercase + trim
  const normalizedName = decodeURIComponent(customerName).toLowerCase().trim()
  const customer = customersResult.value.find(
    (c) => c.customer_name.toLowerCase().trim() === normalizedName
  )

  if (!customer) {
    notFound()
  }

  // Calculate total revenue
  const totalRevenue = (customer.rr || 0) + (customer.nrr || 0)
  const arr = (customer.rr || 0) * 4


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
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary to-[#1a2332] text-paper px-8 pt-12 pb-10">
        {/* W1-P1-001: Decorative SVG grid texture overlay */}
        <div
          className="absolute top-0 right-0 w-[60%] h-full pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="max-w-[1400px] mx-auto relative">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="font-display text-4xl font-light text-paper mb-2">
                {customer.customer_name}
              </h1>
              {/* W1-P1-003: Plain text subtitle — no Badge or HealthIndicator */}
              <p className="text-[var(--paper)]/85 text-base mt-1">
                {customer.bu} Business Unit | Skyvera | Q1 2026
              </p>
            </div>
            <RefreshButton label="Refresh Data" />
          </div>

          {/* W1-P1-002: Stat Cards — Total ARR, Health Score, Business Unit, Account Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div
              className="bg-white/10 p-5 rounded border border-white/10"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-xs uppercase tracking-wider text-[var(--paper)]/70 mb-2">
                Total ARR
              </div>
              <div className="text-[2rem] font-display font-semibold text-paper">
                {arr >= 1000000
                  ? `$${(arr / 1000000).toFixed(1)}M`
                  : `$${(arr / 1000).toFixed(0)}K`}
              </div>
              <p className="text-xs text-[var(--paper)]/60 mt-1">
                Annual Recurring Revenue
              </p>
            </div>
            <div
              className="bg-white/10 p-5 rounded border border-white/10"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-xs uppercase tracking-wider text-[var(--paper)]/70 mb-2">
                Health Score
              </div>
              <div className="text-[2rem] font-display font-semibold text-paper capitalize">
                {customer.healthScore}
              </div>
              <p className="text-xs text-[var(--paper)]/60 mt-1">
                Account health status
              </p>
            </div>
            <div
              className="bg-white/10 p-5 rounded border border-white/10"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-xs uppercase tracking-wider text-[var(--paper)]/70 mb-2">
                Business Unit
              </div>
              <div className="text-[2rem] font-display font-semibold text-paper">
                {customer.bu}
              </div>
              <p className="text-xs text-[var(--paper)]/60 mt-1">
                Skyvera Platform
              </p>
            </div>
            <div
              className="bg-white/10 p-5 rounded border border-white/10"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-xs uppercase tracking-wider text-[var(--paper)]/70 mb-2">
                Account Status
              </div>
              <div className="text-[2rem] font-display font-semibold text-paper">
                Active
              </div>
              <p className="text-xs text-[var(--paper)]/60 mt-1">
                Q1 2026
              </p>
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
            <OverviewTab
              customer={customer}
              intelligenceReport={accountData.intelligence.raw}
              painPoints={accountData.strategy.painPoints}
              opportunities={accountData.strategy.opportunities}
            />
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
            <ActionItemsTab
              initialActions={accountData.actions}
              stakeholders={accountData.stakeholders}
            />
          </Suspense>
        )}
      </div>

      {/* W1-P3-004: Page footer */}
      <footer className="bg-[var(--secondary)] text-[var(--paper)] text-center py-8 mt-16">
        <p className="text-sm opacity-80">
          {customer.customer_name} Strategic Account Plan | {customer.bu} Business Unit | Skyvera
        </p>
        <p className="text-xs opacity-60 mt-1">
          Generated{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}{' '}
          | Confidential — Internal Use Only
        </p>
      </footer>
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
