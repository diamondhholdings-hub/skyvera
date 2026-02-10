/**
 * Financial Summary Section
 * Executive overview with gradient metric cards and critical issues
 */

import { getDashboardData, getBUSummaries } from '@/lib/data/server/dashboard-data'
import { MetricCard } from '../components/metric-card'
import { AlertBox } from '../components/alert-box'
import { BUPerformanceTable } from '../components/bu-performance-table'

export async function FinancialSummarySection() {
  const dashboardResult = await getDashboardData()
  const buSummariesResult = await getBUSummaries()

  if (!dashboardResult.success || !buSummariesResult.success) {
    return (
      <div id="financial-summary" className="p-10 text-center text-slate-500">
        Failed to load financial data
      </div>
    )
  }

  const data = dashboardResult.value
  const buSummaries = buSummariesResult.value

  // Calculate metrics
  const rrPercentage = data.totalRevenue > 0 ? (data.totalRR / data.totalRevenue) * 100 : 0
  const arr = data.totalRR * 4
  const arrYoYChange = -11.9 // From CLAUDE.md
  const marginGap = data.ebitda - data.ebitdaTarget
  const marginGapPct = data.netMarginPct - data.netMarginTarget
  const ruleOf40 = 50.6 // From CLAUDE.md (growth + margin)
  const arAging = 11.5e6 // $11.5M from reference

  return (
    <section id="financial-summary">
      {/* Section Header */}
      <h2 className="text-3xl font-semibold text-[#1e3c72] mb-5 pb-2.5 border-b-[3px] border-[#667eea]">
        Financial Executive Summary
      </h2>

      {/* Overall Assessment Alert */}
      <AlertBox variant="critical">
        <div className="text-lg">
          <strong>OVERALL ASSESSMENT: PROCEED WITH CAUTION</strong>
        </div>
        <div className="mt-2 leading-relaxed">
          Skyvera demonstrates strong profitability metrics ({data.netMarginPct.toFixed(1)}% EBITDA
          margin, ${(data.ebitda / 1e6).toFixed(1)}M quarterly EBITDA) but faces significant
          structural challenges with declining recurring revenue ({arrYoYChange}% YoY) and margin
          compression (-${Math.abs(marginGap / 1e3).toFixed(0)}K gap to target).
        </div>
      </AlertBox>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 my-8">
        <MetricCard
          variant="primary"
          label="Total Revenue (Q1'26)"
          value={`$${(data.totalRevenue / 1e6).toFixed(1)}M`}
          subtitle={`${rrPercentage.toFixed(0)}% Recurring`}
        />
        <MetricCard
          variant="success"
          label="EBITDA"
          value={`$${(data.ebitda / 1e6).toFixed(1)}M`}
          subtitle={`${data.netMarginPct.toFixed(1)}% Margin`}
        />
        <MetricCard
          variant="warning"
          label="Net Margin Gap"
          value={`-$${Math.abs(marginGap / 1e3).toFixed(0)}K`}
          subtitle={`${marginGapPct.toFixed(1)} pts below target`}
        />
        <MetricCard
          variant="danger"
          label="ARR (Annualized)"
          value={`$${(arr / 1e6).toFixed(1)}M`}
          subtitle={`DOWN ${Math.abs(arrYoYChange)}% YoY`}
        />
        <MetricCard
          variant="success"
          label="Rule of 40"
          value={`${ruleOf40.toFixed(1)}%`}
          subtitle="PASSING"
        />
        <MetricCard
          variant="danger"
          label="AR >90 Days"
          value={`$${(arAging / 1e6).toFixed(1)}M`}
          subtitle={`${((arAging / arr) * 100).toFixed(1)}% of ARR`}
        />
      </div>

      {/* Critical Financial Issues */}
      <h3 className="text-2xl font-bold text-[#2a5298] mt-8 mb-4 pb-2 border-b-2 border-slate-200">
        Critical Financial Issues
      </h3>

      {/* Issue 1: Margin Gap */}
      <div className="bg-slate-50 rounded-xl p-5 my-4 border-l-[5px] border-[#667eea]">
        <div className="text-xl font-bold text-[#1e3c72] mb-4">
          1. Margin Gap: -${Math.abs(marginGap / 1e3).toFixed(0)}K (
          {marginGapPct.toFixed(1)} percentage points)
        </div>
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-[#1e3c72] text-white text-left">
              <th className="p-4 font-semibold text-sm">Driver</th>
              <th className="p-4 font-semibold text-sm">Impact</th>
              <th className="p-4 font-semibold text-sm">Explanation</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3 text-sm">HC COGS Increase</td>
              <td className="p-3 text-sm">
                <span className="inline-block px-3 py-1 rounded-2xl bg-[#f5576c] text-white text-xs font-semibold">
                  +$779K
                </span>
              </td>
              <td className="p-3 text-sm">43 new XO contractors hired</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3 text-sm">RR Decline</td>
              <td className="p-3 text-sm">
                <span className="inline-block px-3 py-1 rounded-2xl bg-[#f5576c] text-white text-xs font-semibold">
                  -$336K
                </span>
              </td>
              <td className="p-3 text-sm">Recurring revenue down vs. prior plan</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3 text-sm">NHC Expenses Up</td>
              <td className="p-3 text-sm">
                <span className="inline-block px-3 py-1 rounded-2xl bg-[#fa709a] text-white text-xs font-semibold">
                  +$177K
                </span>
              </td>
              <td className="p-3 text-sm">Software/professional services</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="p-3 text-sm">CF COGS Down</td>
              <td className="p-3 text-sm">
                <span className="inline-block px-3 py-1 rounded-2xl bg-[#4facfe] text-white text-xs font-semibold">
                  -$920K
                </span>
              </td>
              <td className="p-3 text-sm">Vendor optimization (positive)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Issue 2: RR Declining */}
      <div className="bg-slate-50 rounded-xl p-5 my-4 border-l-[5px] border-[#667eea]">
        <div className="text-xl font-bold text-[#1e3c72] mb-4">
          2. Recurring Revenue Declining: -$336K
        </div>
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-[#1e3c72] text-white text-left">
              <th className="p-4 font-semibold text-sm">Business Unit</th>
              <th className="p-4 font-semibold text-sm">Q1'26 Plan</th>
              <th className="p-4 font-semibold text-sm">Prior Plan</th>
              <th className="p-4 font-semibold text-sm">Variance</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {buSummaries.slice(0, 3).map((bu) => {
              // Mock prior plan data (would come from actual data source)
              const variance = bu.bu === 'Cloudsense' ? -355000 : bu.bu === 'Kandy' ? -75000 : 146000
              const priorPlan = bu.totalRR - variance
              const variantColor =
                variance < 0 ? 'bg-[#f5576c]' : variance < 50000 ? 'bg-[#fa709a]' : 'bg-[#4facfe]'

              return (
                <tr key={bu.bu} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-3 text-sm">{bu.bu}</td>
                  <td className="p-3 text-sm">${(bu.totalRR / 1e6).toFixed(2)}M</td>
                  <td className="p-3 text-sm">${(priorPlan / 1e6).toFixed(2)}M</td>
                  <td className="p-3 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-2xl ${variantColor} text-white text-xs font-semibold`}
                    >
                      {variance > 0 ? '+' : ''}${(variance / 1e3).toFixed(0)}K
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Issue 3: Salesforce Contract */}
      <div className="bg-slate-50 rounded-xl p-5 my-4 border-l-[5px] border-[#667eea]">
        <div className="text-xl font-bold text-[#1e3c72] mb-4">
          3. Salesforce UK Contract: $4.1M Annual
        </div>
        <AlertBox variant="critical">
          <strong>CRITICAL CONCERN:</strong> This contract consumes 64% of Cloudsense's recurring
          revenue. At this cost ratio, every dollar of Cloudsense RR decline makes this contract
          increasingly burdensome.
          <ul className="mt-4 ml-6 space-y-2">
            <li>Annual Cost: $4.1M</li>
            <li>Cloudsense RR: $6.37M (quarterly)</li>
            <li>As % of Cloudsense RR: 64%</li>
            <li>
              <strong>Action Required:</strong> Urgent review of utilization and renegotiation
              options
            </li>
          </ul>
        </AlertBox>
      </div>

      {/* BU Performance Table */}
      <h3 className="text-2xl font-bold text-[#2a5298] mt-8 mb-4 pb-2 border-b-2 border-slate-200">
        Business Unit Performance
      </h3>
      <BUPerformanceTable buSummaries={buSummaries} />
    </section>
  )
}
