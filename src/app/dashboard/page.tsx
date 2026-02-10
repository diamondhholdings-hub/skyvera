/**
 * Executive Intelligence Dashboard
 * Professional boxed layout matching Executive Intelligence Report design
 * 7-section navigation with gradient metric cards and semantic color coding
 */

import { Suspense } from 'react'
import { FinancialSummarySection } from './sections/financial-summary'
import { FinancialDetailedSection } from './sections/financial-detailed'
import { CustomerSummarySection } from './sections/customer-summary'
import { TopCustomersSection } from './sections/top-customers'
import { AtRiskSection } from './sections/at-risk'
import { ExpansionSection } from './sections/expansion'
import { ActionPlanSection } from './sections/action-plan'
import { DashboardNavigation } from './components/dashboard-navigation'

// Skeleton fallback
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-64 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3c72] to-[#2a5298] p-5">
      {/* Main Container - White boxed layout */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden">

        {/* Header */}
        <header className="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white py-10 px-10 text-center">
          <h1 className="text-5xl font-bold mb-2.5">
            Skyvera Executive Intelligence Report
          </h1>
          <div className="text-xl opacity-90 mb-2.5">
            Financial & Customer Intelligence Analysis - Q1'26
          </div>
          <div className="text-base opacity-80">
            Report Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | Classification: Executive Confidential
          </div>
        </header>

        {/* 7-Section Navigation */}
        <DashboardNavigation />

        {/* Content Area */}
        <div className="p-10">
          <Suspense fallback={<DashboardSkeleton />}>
            {/* All sections render, visibility controlled by client component */}
            <FinancialSummarySection />
            <FinancialDetailedSection />
            <CustomerSummarySection />
            <TopCustomersSection />
            <AtRiskSection />
            <ExpansionSection />
            <ActionPlanSection />
          </Suspense>
        </div>

        {/* Footer */}
        <footer className="bg-[#1e3c72] text-white py-8 px-10 text-center">
          <div className="mb-5">
            <div className="text-lg font-semibold mb-2">Skyvera Intelligence Platform</div>
            <div className="opacity-80 text-sm">
              Powered by AI-driven analysis and real-time data integration
            </div>
          </div>
          <div className="pt-5 border-t border-white/20 opacity-70 text-sm">
            © 2026 Skyvera. Executive Confidential. All Rights Reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
