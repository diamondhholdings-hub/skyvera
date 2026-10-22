/**
 * Financial Summary Section
 * Overall assessment, key financial issues and BU performance.
 * Headline figures live in the page header (components/headline-kpis.tsx).
 */

import { getDashboardData, getBUSummaries } from '@/lib/data/server/dashboard-data'
import { AlertBox } from '../components/alert-box'
import { BUPerformanceTable } from '../components/bu-performance-table'
import { Panel, SectionHeading, SignedFigure } from '../components/panel'

export async function FinancialSummarySection() {
  const dashboardResult = await getDashboardData()
  const buSummariesResult = await getBUSummaries()

  if (!dashboardResult.success || !buSummariesResult.success) {
    return (
      <div id="financial-summary" className="py-10 text-center" style={{ color: 'var(--muted)' }}>
        Failed to load financial data
      </div>
    )
  }

  const data = dashboardResult.value
  const buSummaries = buSummariesResult.value

  // Calculate metrics
  const marginGap = data.ebitda - data.ebitdaTarget
  const marginGapPct = data.netMarginPct - data.netMarginTarget
  // Real value from the Excel Comparison-to-PP sheets; null only if the
  // source workbook is missing that data for this quarter.
  const arrYoYChange = data.arrYoYChangePct
  const totalRRVariance = data.totalRR - data.rrTarget

  const marginDrivers = [
    { driver: 'HC COGS increase', impact: '+$779K', good: false, explanation: '43 new XO contractors hired' },
    { driver: 'RR decline', impact: '-$336K', good: false, explanation: 'Recurring revenue down vs. prior plan' },
    { driver: 'NHC expenses up', impact: '+$177K', good: false, explanation: 'Software and professional services' },
    { driver: 'CF COGS down', impact: '-$920K', good: true, explanation: 'Vendor optimization (positive)' },
  ]

  return (
    <section id="financial-summary" style={{ display: 'none' }}>
      <SectionHeading title="Financial summary" />

      {/* Overall Assessment Alert */}
      <AlertBox variant="critical">
        <div className="font-semibold">Overall assessment: proceed with caution</div>
        <div className="mt-1">
          Skyvera shows strong profitability ({data.netMarginPct.toFixed(1)}% EBITDA margin,{' '}
          <span className="num">${(data.ebitda / 1e6).toFixed(1)}M</span> quarterly EBITDA) but faces
          structural challenges: declining recurring revenue (
          {arrYoYChange !== null ? `${Math.abs(arrYoYChange).toFixed(1)}% YoY` : 'YoY change unavailable'}
          ) and margin compression (-${Math.abs(marginGap / 1e3).toFixed(0)}K gap to target).
        </div>
      </AlertBox>

      {/* Key financial issues */}
      <h3 className="m-0 mb-3 mt-8">Key financial issues</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Margin gap */}
        <Panel
          title={`Margin gap: -$${Math.abs(marginGap / 1e3).toFixed(0)}K`}
          description={`${marginGapPct.toFixed(1)} percentage points vs. target`}
          flush
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th style={{ textAlign: 'right' }}>Impact</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                {marginDrivers.map((row) => (
                  <tr key={row.driver}>
                    <td className="font-medium">{row.driver}</td>
                    <td style={{ textAlign: 'right' }}>
                      <SignedFigure value={row.impact} good={row.good} />
                    </td>
                    <td style={{ color: 'var(--ink-2)' }}>{row.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* RR variance */}
        <Panel
          title={`Recurring revenue ${totalRRVariance < 0 ? 'declining' : 'growing'}: ${totalRRVariance > 0 ? '+' : '-'}$${Math.abs(totalRRVariance / 1e3).toFixed(0)}K`}
          description="Current plan vs. prior plan, by business unit"
          flush
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business unit</th>
                  <th style={{ textAlign: 'right' }}>Current plan</th>
                  <th style={{ textAlign: 'right' }}>Prior plan</th>
                  <th style={{ textAlign: 'right' }}>Variance</th>
                </tr>
              </thead>
              <tbody>
                {buSummaries.slice(0, 3).map((bu) => {
                  const priorPlan = bu.rrPriorPlan
                  const variance = priorPlan !== undefined ? bu.totalRR - priorPlan : null

                  return (
                    <tr key={bu.bu}>
                      <td className="font-medium">{bu.bu}</td>
                      <td className="num" style={{ textAlign: 'right' }}>${(bu.totalRR / 1e6).toFixed(2)}M</td>
                      <td className="num" style={{ textAlign: 'right' }}>
                        {priorPlan !== undefined ? `$${(priorPlan / 1e6).toFixed(2)}M` : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <SignedFigure
                          value={variance === null ? 'N/A' : `${variance > 0 ? '+' : variance < 0 ? '-' : ''}$${Math.abs(variance / 1e3).toFixed(0)}K`}
                          good={variance === null ? null : variance >= 0}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Salesforce contract */}
      <div className="mt-4">
        <Panel title="Salesforce UK contract: $4.1M annual">
          <AlertBox variant="critical">
            <strong>Critical concern.</strong> This contract consumes 64% of Cloudsense&apos;s recurring
            revenue. At this cost ratio, every dollar of Cloudsense RR decline makes it more burdensome.
          </AlertBox>
          <dl className="m-0 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt style={{ color: 'var(--muted)' }}>Annual cost</dt>
              <dd className="num m-0 font-medium">$4.1M</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--muted)' }}>Cloudsense RR (quarterly)</dt>
              <dd className="num m-0 font-medium">$6.37M</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--muted)' }}>As % of Cloudsense RR</dt>
              <dd className="num m-0 font-medium">64%</dd>
            </div>
          </dl>
          <p className="m-0 mt-4 text-sm" style={{ color: 'var(--ink-2)' }}>
            <strong style={{ color: 'var(--ink)' }}>Action required:</strong> urgent review of utilization and
            renegotiation options.
          </p>
        </Panel>
      </div>

      {/* BU Performance Table */}
      <div className="mt-8">
        <Panel title="Business unit performance" description="Select a row to see that unit's accounts" flush>
          <BUPerformanceTable buSummaries={buSummaries} />
        </Panel>
      </div>
    </section>
  )
}
