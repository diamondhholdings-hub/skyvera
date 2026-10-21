/**
 * Portfolio overview (dashboard)
 * Headline figures in the page header, then one section at a time via ?section=
 */

import { Suspense } from 'react'
import { FinancialSummarySection } from './sections/financial-summary'
import { FinancialDetailedSection } from './sections/financial-detailed'
import { CustomerSummarySection } from './sections/customer-summary'
import { TopCustomersSection } from './sections/top-customers'
import { AtRiskSection } from './sections/at-risk'
import { ExpansionSection } from './sections/expansion'
import { ActionPlanSection } from './sections/action-plan'
import { DMBriefingSection } from './sections/dm-briefing'
import { DashboardNavigation } from './components/dashboard-navigation'
import { HeadlineKpis, HeadlineKpisSkeleton } from './components/headline-kpis'
import { PageHeader } from '@/components/ui/page-header'
import { getFiscalQuarterLabel } from '@/lib/data/server/fiscal-quarter'

// Skeleton fallback
function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="skeleton h-56" />
      <div className="skeleton h-72" />
    </div>
  )
}

const SECTION_IDS = [
  'financial-summary',
  'financial-detailed',
  'customer-summary',
  'top-customers',
  'at-risk',
  'expansion',
  'action-plan',
] as const

type SectionId = (typeof SECTION_IDS)[number]

function renderSection(id: SectionId) {
  switch (id) {
    case 'financial-summary':
      return <FinancialSummarySection />
    case 'financial-detailed':
      return <FinancialDetailedSection />
    case 'customer-summary':
      return <CustomerSummarySection />
    case 'top-customers':
      return <TopCustomersSection />
    case 'at-risk':
      return <AtRiskSection />
    case 'expansion':
      return <ExpansionSection />
    case 'action-plan':
      return <ActionPlanSection />
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>
}) {
  const params = await searchParams
  const requested = params?.section
  const activeSection: SectionId =
    requested && (SECTION_IDS as readonly string[]).includes(requested)
      ? (requested as SectionId)
      : 'financial-summary'

  const quarter = getFiscalQuarterLabel()
  const subtitle = `${quarter ? `${quarter} budget` : 'Current budget'} · Cloudsense, Kandy, STL and NewNet`

  return (
    <div>
      <PageHeader title="Portfolio overview" subtitle={subtitle}>
        <Suspense fallback={<HeadlineKpisSkeleton />}>
          <HeadlineKpis />
        </Suspense>
      </PageHeader>

      {/* Section navigation */}
      <Suspense fallback={<div className="h-[41px] border-b" style={{ borderColor: 'var(--border)' }} />}>
        <DashboardNavigation />
      </Suspense>

      {/* Content Area */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <Suspense fallback={<DashboardSkeleton />}>
          {/* Only the active section is rendered server-side. The wrapper
              attribute pairs with a CSS rule in globals.css that overrides
              the legacy inline `display: none` on each <section>. */}
          <div data-active-section={activeSection}>{renderSection(activeSection)}</div>

          {/* Revenue retention priorities, shown under every section */}
          <DMBriefingSection />
        </Suspense>
      </div>

      <footer
        className="mx-auto max-w-[1400px] px-4 pb-8 pt-2 text-xs lg:px-8"
        style={{ color: 'var(--muted)' }}
      >
        &copy; 2026 Skyvera. Confidential.
      </footer>
    </div>
  )
}
