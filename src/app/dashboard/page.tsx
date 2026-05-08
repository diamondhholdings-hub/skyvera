/**
 * Executive Intelligence Dashboard
 * Editorial design system — uses CSS design tokens throughout
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
import { PageHeader } from '@/components/ui/page-header'

// Skeleton fallback
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-64 bg-[var(--border)] rounded-[15px]" />
      <div className="grid grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-[var(--border)] rounded-[15px]" />
        ))}
      </div>
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

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Skyvera Executive Intelligence Report"
        subtitle="Financial & Customer Intelligence Analysis — Q1&#x2019;26"
        centered
      />

      {/* 7-Section Navigation */}
      <Suspense fallback={<div className="h-10 bg-[var(--border)] animate-pulse rounded" />}>
        <DashboardNavigation />
      </Suspense>

      {/* Content Area */}
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <Suspense fallback={<DashboardSkeleton />}>
          {/* DM% Strategy Briefing - Top Priority Recommendations */}
          <DMBriefingSection />

          {/* Only the active section is rendered server-side. The wrapper
              attribute pairs with a CSS rule in globals.css that overrides
              the legacy inline `display: none` on each <section>. */}
          <div data-active-section={activeSection}>{renderSection(activeSection)}</div>
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--secondary)] text-[var(--paper)] px-10 py-8 text-center">
        <div className="mb-5">
          <div className="text-lg font-semibold mb-2">Skyvera Intelligence Platform</div>
          <div className="text-[var(--paper)]/80 text-sm">
            Powered by AI-driven analysis and real-time data integration
          </div>
        </div>
        <div className="pt-5 border-t border-[var(--paper)]/20 text-[var(--paper)]/70 text-sm">
          &copy; 2026 Skyvera. Executive Confidential. All Rights Reserved.
        </div>
      </footer>
    </div>
  )
}
