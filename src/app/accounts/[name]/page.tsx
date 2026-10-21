/**
 * Account Plan Page - Individual customer account details with 8-tab navigation
 * Server Component - fetches account plan data and customer financials
 * URL format: /accounts/[encoded-name]?tab=overview
 * Next.js 16: params and searchParams are Promises
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccountPlanData } from '@/lib/data/server/account-plan-data'
import { getAllCustomersWithHealth } from '@/lib/data/server/account-data'
import { getFiscalQuarterLabel } from '@/lib/data/server/fiscal-quarter'
import { TabNavigation } from './_components/tab-navigation'
import { OverviewTab } from './_components/overview-tab'
import { FinancialsTab } from './_components/financials-tab'
import { KeyExecutivesTab } from './_components/key-executives-tab'
import { OrgStructureTab } from './_components/org-structure-tab'
import { PainPointsTab } from './_components/pain-points-tab'
import { CompetitiveTab } from './_components/competitive-tab'
import { ActionPlanTab } from './_components/action-plan-tab'
import { IntelligenceTab } from './_components/intelligence-tab'
import { RefreshButton } from '@/components/ui/refresh-button'
import { SalesforceSyncButton } from '@/components/ui/salesforce-sync-button'
import { PrintButton } from '@/components/ui/print-button'
import { AccountChatPanel } from '@/components/account-chat-panel'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { KpiStrip } from '@/components/ui/kpi-strip'
import { ChevronLeft, CircleAlert } from 'lucide-react'

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
  const quarterLabel = getFiscalQuarterLabel()

  if (!accountDataResult.success) {
    return (
      <LoadError title="Unable to load account data" message={accountDataResult.error.message} />
    )
  }

  const accountData = accountDataResult.value


  // Fetch customer financial data and health
  const customersResult = await getAllCustomersWithHealth()

  if (!customersResult.success) {
    return (
      <LoadError title="Unable to load customer data" message={customersResult.error.message} />
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
  const arr = totalRevenue // rr + nrr; for NRR-only accounts rr=0 so use total


  const healthLabel = { green: 'Healthy', yellow: 'At risk', red: 'Critical' }[customer.healthScore]
  const healthTone = ({ green: 'success', yellow: 'warning', red: 'critical' } as const)[customer.healthScore]

  return (
    <div>
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1400px] px-4 pb-5 pt-5 lg:px-8">
          <div data-print="hide">
            <Link href="/accounts" className="account-back-link inline-flex items-center gap-1 text-[0.8125rem] font-medium">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Back to accounts
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 id="account-page-title" className="m-0 break-words">
                {customer.customer_name}
              </h1>
              <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                {[`${customer.bu} business unit`, 'Skyvera', quarterLabel].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2" data-print="hide">
              <PrintButton customerName={customerName} />
              <RefreshButton label="Refresh data" />
              <SalesforceSyncButton accountName={customerName} />
            </div>
          </div>

          <div className="mt-5">
            <KpiStrip
              items={[
                {
                  label: 'Annual revenue',
                  value: arr >= 1_000_000 ? `$${(arr / 1_000_000).toFixed(1)}M` : `$${(arr / 1000).toFixed(0)}K`,
                  context: customer.rr > 0 ? 'Recurring and non-recurring' : 'Non-recurring revenue',
                },
                {
                  label: 'Health score',
                  value: healthLabel,
                  context: customer.healthFactors.length > 0 ? customer.healthFactors[0] : 'Account health status',
                  tone: healthTone,
                },
                { label: 'Business unit', value: customer.bu, context: customer.rank ? `Rank ${customer.rank} by revenue` : 'Skyvera platform' },
                { label: 'Account status', value: 'Active', context: quarterLabel || 'Current quarter' },
              ]}
            />
          </div>
        </div>
        <style>{`
          .account-back-link { color: var(--secondary); text-decoration: none; }
          .account-back-link:hover { text-decoration: underline; text-underline-offset: 2px; }
        `}</style>
      </header>

      {/* Tab Navigation */}
      <div data-print="hide">
        <TabNavigation accountName={name} />
      </div>

      {/* Tab Content */}
      <main id="tab-panel" aria-labelledby="account-page-title" className="mx-auto max-w-[1400px] px-4 py-6 pb-24 lg:px-8">
        {activeTab === 'overview' && (
          <Suspense fallback={<TabSkeleton />}>
            <OverviewTab
              customer={customer}
              intelligenceReport={accountData.intelligence.raw}
              painPoints={accountData.strategy.painPoints}
              opportunities={accountData.strategy.opportunities}
              allBuCustomers={customersResult.value.filter(c => c.bu === customer.bu)}
            />
          </Suspense>
        )}

        {activeTab === 'key-executives' && (
          <Suspense fallback={<TabSkeleton />}>
            <KeyExecutivesTab stakeholders={accountData.stakeholders} />
          </Suspense>
        )}

        {activeTab === 'org-structure' && (
          <Suspense fallback={<TabSkeleton />}>
            <OrgStructureTab stakeholders={accountData.stakeholders} customerName={customerName} bu={customer.bu} />
          </Suspense>
        )}

        {activeTab === 'pain-points' && (
          <Suspense fallback={<TabSkeleton />}>
            <PainPointsTab
              painPoints={accountData.strategy.painPoints}
              opportunities={accountData.strategy.opportunities}
              accountName={customerName}
            />
          </Suspense>
        )}

        {activeTab === 'competitive' && (
          <Suspense fallback={<TabSkeleton />}>
            <CompetitiveTab competitors={accountData.competitors} />
          </Suspense>
        )}

        {activeTab === 'action-plan' && (
          <Suspense fallback={<TabSkeleton />}>
            <ActionPlanTab
              actions={accountData.actions}
              stakeholders={accountData.stakeholders}
              accountName={customerName}
            />
          </Suspense>
        )}

        {activeTab === 'financials' && (
          <Suspense fallback={<TabSkeleton />}>
            <FinancialsTab customer={customer} allBuCustomers={customersResult.value.filter(c => c.bu === customer.bu)} />
          </Suspense>
        )}

        {activeTab === 'intelligence' && (
          <Suspense fallback={<TabSkeleton />}>
            <IntelligenceTab
              intelligenceReport={accountData.intelligence}
              news={accountData.news}
              customerName={customerName}
              enrichment={accountData.enrichment ?? null}
            />
          </Suspense>
        )}
      </main>

      {/* W1-P3-004: Page footer */}
      <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1400px] px-4 py-6 text-xs lg:px-8" style={{ color: 'var(--muted)' }}>
          <p className="m-0">
            {customer.customer_name} account plan · {customer.bu} business unit · Skyvera
          </p>
          <p className="m-0 mt-1">
            Generated{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            {' '}· Confidential, internal use only
          </p>
        </div>
      </footer>
      {/* Floating account chat panel: error boundary prevents a chat crash from killing the page */}
      <ErrorBoundary>
        <AccountChatPanel customerName={customerName} bu={customer.bu} />
      </ErrorBoundary>
    </div>
  )
}

/**
 * Loading skeleton for tab content
 */
function TabSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="card space-y-3 p-5">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-64" />
        <div className="skeleton h-64" />
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
