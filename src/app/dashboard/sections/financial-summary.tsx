/**
 * Financial Summary Section
 * Executive overview with gradient metric cards and critical issues
 * Uses CSS design tokens — no hardcoded hex colors
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
      <div id="financial-summary" className="py-10 text-center text-[var(--muted)]">
        Failed to load financial data
      </div>
    )
  }

  const data = dashboardResult.value
  const buSummaries = buSummariesResult.value

  // Calculate metrics
  const rrPercentage = data.totalRevenue > 0 ? (data.totalRR / data.totalRevenue) * 100 : 0
  const arr = data.totalRR * 4
  const marginGap = data.ebitda - data.ebitdaTarget
  const marginGapPct = data.netMarginPct - data.netMarginTarget
  // Real values from the Excel Comparison-to-PP and AR Aging sheets — null
  // only if the source workbook is missing that data for this quarter.
  const arrYoYChange = data.arrYoYChangePct
  const ruleOf40 = data.ruleOf40
  const arAging = data.arAgingOver90
  const totalRRVariance = data.totalRR - data.rrTarget

  return (
    <section id="financial-summary" style={{ display: 'none' }}>
      {/* Section Header */}
      <h2 className="font-display text-3xl font-semibold text-[var(--secondary)] mt-8 mb-5 pb-3 border-b-4 border-[var(--secondary)]">
        Financial Executive Summary
      </h2>

      {/* Overall Assessment Alert */}
      <AlertBox variant="critical">
        <div className="text-base font-bold">
          OVERALL ASSESSMENT: PROCEED WITH CAUTION
        </div>
        <div className="mt-2 leading-7">
          Skyvera demonstrates strong profitability metrics ({data.netMarginPct.toFixed(1)}% EBITDA
          margin, ${(data.ebitda / 1e6).toFixed(1)}M quarterly EBITDA) but faces significant
          structural challenges with declining recurring revenue (
          {arrYoYChange !== null ? `${Math.abs(arrYoYChange).toFixed(1)}% YoY` : 'YoY change unavailable'}
          ) and margin compression (-${Math.abs(marginGap / 1e3).toFixed(0)}K gap to target).
        </div>
      </AlertBox>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 my-8">
        <MetricCard
          variant="primary"
          label="Total Revenue (Current Quarter)"
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
          subtitle={
            arrYoYChange !== null
              ? `${arrYoYChange < 0 ? 'DOWN' : 'UP'} ${Math.abs(arrYoYChange).toFixed(1)}% YoY`
              : 'YoY change unavailable'
          }
        />
        <MetricCard
          variant={ruleOf40 !== null && ruleOf40 >= 40 ? 'success' : 'danger'}
          label="Rule of 40"
          value={ruleOf40 !== null ? `${ruleOf40.toFixed(1)}%` : 'N/A'}
          subtitle={ruleOf40 === null ? 'DATA UNAVAILABLE' : ruleOf40 >= 40 ? 'PASSING' : 'FAILING'}
        />
        <MetricCard
          variant="danger"
          label="AR >90 Days"
          value={arAging !== null ? `$${(arAging / 1e6).toFixed(1)}M` : 'N/A'}
          subtitle={arAging !== null ? `${((arAging / arr) * 100).toFixed(1)}% of ARR` : 'DATA UNAVAILABLE'}
        />
      </div>
      {(arrYoYChange === null || ruleOf40 === null || arAging === null) && (
        <p className="text-xs italic text-[var(--muted)] -mt-4 mb-8">
          Note: one or more of ARR YoY change, Rule of 40, and AR &gt;90 Days could not be computed
          from the current workbook and are shown as unavailable rather than estimated.
        </p>
      )}

      {/* Critical Financial Issues */}
      <h3 className="font-display text-xl font-medium text-[var(--ink)] mt-8 mb-4">
        Critical Financial Issues
      </h3>

      {/* Issue 1: Margin Gap */}
      <div className="bg-[var(--highlight)] rounded-[15px] p-5 my-4 border-l-[5px] border-l-[var(--secondary)]">
        <div className="text-lg font-bold text-[var(--secondary)] mb-4">
          1. Margin Gap: -${Math.abs(marginGap / 1e3).toFixed(0)}K (
          {marginGapPct.toFixed(1)} percentage points)
        </div>
        <table
          className="w-full border-collapse rounded-[10px] overflow-hidden"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        >
          <thead>
            <tr className="bg-[var(--secondary)] text-[var(--paper)] text-left">
              <th className="p-[15px] font-semibold text-sm">Driver</th>
              <th className="p-[15px] font-semibold text-sm">Impact</th>
              <th className="p-[15px] font-semibold text-sm">Explanation</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-sm">HC COGS Increase</td>
              <td className="p-3 text-sm">
                <span className="inline-block px-3 py-1 rounded-[15px] bg-[var(--critical)] text-white text-xs font-semibold">
                  +$779K
                </span>
              </td>
              <td className="p-3 text-sm">43 new XO contractors hired</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-sm">RR Decline</td>
              <td className="p-3 text-sm">
                <span className="inline-block px-3 py-1 rounded-[15px] bg-[var(--critical)] text-white text-xs font-semibold">
                  -$336K
                </span>
              </td>
              <td className="p-3 text-sm">Recurring revenue down vs. prior plan</td>
            </tr>
            <tr className="border-b border-[var(--border)]">
              <td className="p-3 text-sm">NHC Expenses Up</td>
              <td className="p-3 text-sm">
                <span className="inline-block px-3 py-1 rounded-[15px] bg-[var(--critical)] text-white text-xs font-semibold">
                  +$177K
                </span>
              </td>
              <td className="p-3 text-sm">Software/professional services</td>
            </tr>
            <tr>
              <td className="p-3 text-sm">CF COGS Down</td>
              <td className="p-3 text-sm">
                <span className="inline-block px-3 py-1 rounded-[15px] bg-[var(--success)] text-white text-xs font-semibold">
                  -$920K
                </span>
              </td>
              <td className="p-3 text-sm">Vendor optimization (positive)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Issue 2: RR Declining */}
      <div className="bg-[var(--highlight)] rounded-[15px] p-5 my-4 border-l-[5px] border-l-[var(--secondary)]">
        <div className="text-lg font-bold text-[var(--secondary)] mb-2">
          2. Recurring Revenue {totalRRVariance < 0 ? 'Declining' : 'Growing'}: {totalRRVariance > 0 ? '+' : '-'}$
          {Math.abs(totalRRVariance / 1e3).toFixed(0)}K
        </div>
        <table
          className="w-full border-collapse rounded-[10px] overflow-hidden"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        >
          <thead>
            <tr className="bg-[var(--secondary)] text-[var(--paper)] text-left">
              <th className="p-[15px] font-semibold text-sm">Business Unit</th>
              <th className="p-[15px] font-semibold text-sm">Current Plan</th>
              <th className="p-[15px] font-semibold text-sm">Prior Plan</th>
              <th className="p-[15px] font-semibold text-sm">Variance</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {buSummaries.slice(0, 3).map((bu) => {
              const priorPlan = bu.rrPriorPlan
              const variance = priorPlan !== undefined ? bu.totalRR - priorPlan : null
              const variantColorClass =
                variance === null ? 'bg-[var(--muted)]' : variance < 0 ? 'bg-[var(--critical)]' : 'bg-[var(--success)]'

              return (
                <tr key={bu.bu} className="border-b border-[var(--border)]">
                  <td className="p-3 text-sm">{bu.bu}</td>
                  <td className="p-3 text-sm">${(bu.totalRR / 1e6).toFixed(2)}M</td>
                  <td className="p-3 text-sm">
                    {priorPlan !== undefined ? `$${(priorPlan / 1e6).toFixed(2)}M` : 'N/A'}
                  </td>
                  <td className="p-3 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-[15px] ${variantColorClass} text-white text-xs font-semibold`}
                    >
                      {variance === null
                        ? 'N/A'
                        : `${variance > 0 ? '+' : ''}$${(variance / 1e3).toFixed(0)}K`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Issue 3: Salesforce Contract */}
      <div className="bg-[var(--highlight)] rounded-[15px] p-5 my-4 border-l-[5px] border-l-[var(--secondary)]">
        <div className="text-lg font-bold text-[var(--secondary)] mb-4">
          3. Salesforce UK Contract: $4.1M Annual
        </div>
        <AlertBox variant="critical">
          <strong>CRITICAL CONCERN:</strong> This contract consumes 64% of Cloudsense&apos;s recurring
          revenue. At this cost ratio, every dollar of Cloudsense RR decline makes this contract
          increasingly burdensome.
          <ul className="mt-4 ml-6 leading-8 list-disc">
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
      <h3 className="font-display text-xl font-medium text-[var(--ink)] mt-8 mb-4">
        Business Unit Performance
      </h3>
      <BUPerformanceTable buSummaries={buSummaries} />
    </section>
  )
}
