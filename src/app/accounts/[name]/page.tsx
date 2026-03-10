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
  const arr = totalRevenue // rr + nrr; for NRR-only accounts rr=0 so use total


  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      {/* Back link */}
      <div className="max-w-[1400px] mx-auto px-8 pt-4">
        <Link
          href="/accounts"
          className="inline-flex items-center text-sm text-accent hover:text-accent/80 hover:underline"
        >
          ← Back to Accounts
        </Link>
      </div>

      {/* Hero Header — matches Telstra: gradient secondary→#1a2332, subtle SVG grid, glass stat cards */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%)',
          color: 'var(--paper)',
          padding: '4rem 2rem 3rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Telstra-style subtle SVG grid overlay — right 60%, very low opacity stroke */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '60%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0.5,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          }}
        />
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontSize: '3.5rem', fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--paper)', lineHeight: 1.1 }}>
                {customer.customer_name}
              </h1>
              <p style={{ fontSize: '1.1rem', opacity: 0.85, marginTop: '0.5rem' }}>
                {customer.bu} Business Unit | Skyvera | Q1 2026
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <RefreshButton label="Refresh Data" />
              <SalesforceSyncButton accountName={customerName} />
            </div>
          </div>

          {/* Glass stat cards — Telstra: rgba(255,255,255,0.08), blur(10px), 4px radius */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginTop: '2rem' }}>
            {[
              {
                label: 'Annual Revenue',
                value: arr >= 1_000_000 ? `$${(arr / 1_000_000).toFixed(1)}M` : `$${(arr / 1000).toFixed(0)}K`,
                sub: customer.rr > 0 ? 'Recurring + Non-Recurring' : 'Non-Recurring Revenue',
              },
              {
                label: 'Health Score',
                value: customer.healthScore.charAt(0).toUpperCase() + customer.healthScore.slice(1),
                sub: 'Account health status',
              },
              { label: 'Business Unit', value: customer.bu, sub: 'Skyvera Platform' },
              { label: 'Account Status', value: 'Active', sub: 'Q1 2026' },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  padding: '1.5rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: '0.5rem' }}>
                  {label}
                </div>
                <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display, "Cormorant Garamond", serif)', fontWeight: 600 }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
                  {sub}
                </div>
              </div>
            ))}
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
