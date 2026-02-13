/**
 * Executive Intelligence Dashboard
 * Exact match to Skyvera_Executive_Intelligence_Report.html
 * Uses inline styles extracted from reference HTML
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

// Skeleton fallback
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-64 bg-slate-100 rounded-[15px]" />
      <div className="grid grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-[15px]" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      minHeight: '100vh',
      padding: '20px',
      lineHeight: 1.6
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header - exact match */}
        <header style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.8em',
            marginBottom: '10px',
            fontWeight: 700
          }}>
            Skyvera Executive Intelligence Report
          </h1>
          <div style={{
            fontSize: '1.3em',
            opacity: 0.9,
            marginBottom: '10px'
          }}>
            Financial & Customer Intelligence Analysis - Q1'26
          </div>
          <div style={{ fontSize: '1em', opacity: 0.8 }}>
            Report Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | Classification: Executive Confidential
          </div>
        </header>

        {/* 7-Section Navigation - exact match */}
        <DashboardNavigation />

        {/* Content Area */}
        <div style={{ padding: '40px' }}>
          <Suspense fallback={<DashboardSkeleton />}>
            {/* DM% Strategy Briefing - Top Priority Recommendations */}
            <DMBriefingSection />

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

        {/* Footer - exact match */}
        <footer style={{
          background: '#1e3c72',
          color: 'white',
          padding: '30px 40px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '1.2em', fontWeight: 600, marginBottom: '10px' }}>
              Skyvera Intelligence Platform
            </div>
            <div style={{ opacity: 0.8, fontSize: '0.95em' }}>
              Powered by AI-driven analysis and real-time data integration
            </div>
          </div>
          <div style={{
            paddingTop: '20px',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            opacity: 0.7,
            fontSize: '0.9em'
          }}>
            © 2026 Skyvera. Executive Confidential. All Rights Reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
