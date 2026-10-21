/**
 * DM% (Decline/Maintenance Rate) Tracker Component
 * Displays TTM DM% tracking and forecasting for all business units
 * DM% = (Current Year Revenue / Prior Year Revenue) × 100
 * Target: ≥90% (retain at least 90% of last year's revenue)
 */

import { getDMTrackerData } from '@/lib/data/server/dm-tracker-data'
import { KpiStrip } from '@/components/ui/kpi-strip'
import { Badge } from '@/components/ui/badge'
import { AlertBox } from './alert-box'
import { DMTrendChart } from './dm-trend-chart'
import { Panel, SectionHeading, SignedFigure } from './panel'

const right = { textAlign: 'right' as const }

function PassFail({ pass }: { pass: boolean }) {
  return <Badge variant={pass ? 'success' : 'danger'}>{pass ? 'Pass' : 'Fail'}</Badge>
}

const confidenceVariant = { high: 'success', medium: 'default', low: 'warning' } as const

export async function DMTracker() {
  const result = await getDMTrackerData()

  if (!result.success) {
    return (
      <div
        className="p-10 text-center text-sm"
        style={{
          color: 'var(--muted)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        Failed to load DM% tracking data: {result.error.message}
      </div>
    )
  }

  const data = result.value
  const money = (v: number) => `$${(v / 1e6).toFixed(2)}M`
  const signedK = (v: number) => `${v >= 0 ? '+' : '-'}$${Math.abs(v / 1e3).toFixed(0)}K`

  return (
    <section id="dm-tracker">
      <SectionHeading
        title="DM% tracking and forecast"
        description={
          <>
            DM% (decline/maintenance rate) measures revenue retention by comparing current period
            revenue to the prior period. Target is ≥90%; lower values mean revenue is contracting.
          </>
        }
      />

      {/* Consolidated DM% Alert */}
      <AlertBox variant={data.consolidated.meets_target ? 'success' : 'critical'}>
        <div className="font-semibold">
          Consolidated DM% vs prior plan: <span className="num">{data.consolidated.dm_pct.toFixed(2)}%</span>,{' '}
          {data.consolidated.meets_target ? 'passing' : 'failing'}
        </div>
        <div className="mt-1">
          {data.consolidated.meets_target
            ? 'Revenue retention is above target.'
            : 'Revenue retention is below the 90% target and needs action.'}{' '}
          Current quarter RR is <span className="num">{money(data.consolidated.current_rr)}</span> vs.{' '}
          <span className="num">{money(data.consolidated.prior_rr)}</span> in the prior period (variance{' '}
          <span className="num">{signedK(data.consolidated.variance)}</span>).
        </div>
      </AlertBox>

      {/* Business Unit Breakdown */}
      <h3 className="m-0 mb-3 mt-6">DM% by business unit</h3>
      <KpiStrip
        items={data.business_units.map((bu) => ({
          label: bu.bu,
          value: `${bu.dm_pct.toFixed(1)}%`,
          context: `${bu.meets_target ? 'Passing' : 'Failing'} · target ≥90%`,
          tone: bu.meets_target ? 'success' : 'critical',
        }))}
      />

      {/* Detailed Table */}
      <div className="mt-6">
        <Panel title="Detailed breakdown" flush>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business unit</th>
                  <th style={right}>Current RR</th>
                  <th style={right}>Prior RR</th>
                  <th style={right}>DM%</th>
                  <th style={right}>Variance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.business_units.map((bu) => (
                  <tr key={bu.bu}>
                    <td className="font-medium">{bu.bu}</td>
                    <td className="num" style={right}>{money(bu.current_rr)}</td>
                    <td className="num" style={right}>{money(bu.prior_rr)}</td>
                    <td style={right}>
                      <SignedFigure value={`${bu.dm_pct.toFixed(2)}%`} good={bu.meets_target} />
                    </td>
                    <td style={right}>
                      <SignedFigure value={signedK(bu.variance)} good={bu.variance >= 0} />
                    </td>
                    <td><PassFail pass={bu.meets_target} /></td>
                  </tr>
                ))}
                {/* Consolidated Row */}
                <tr style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border-strong)' }}>
                  <td className="font-semibold">Consolidated</td>
                  <td className="num font-semibold" style={right}>{money(data.consolidated.current_rr)}</td>
                  <td className="num font-semibold" style={right}>{money(data.consolidated.prior_rr)}</td>
                  <td style={right}>
                    <SignedFigure value={`${data.consolidated.dm_pct.toFixed(2)}%`} good={data.consolidated.meets_target} />
                  </td>
                  <td style={right}>
                    <SignedFigure value={signedK(data.consolidated.variance)} good={data.consolidated.variance >= 0} />
                  </td>
                  <td><PassFail pass={data.consolidated.meets_target} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Trend Visualization */}
      <div className="mt-6">
        <Panel title="Year-over-year RR retention" description="Each quarter's recurring revenue against the same quarter a year earlier, consolidated and per business unit, with the 90% target. Dashed: the budget plan for coming quarters.">
          <DMTrendChart data={data} />
        </Panel>
      </div>

      {/* Forecast Summary */}
      <div className="mt-6">
        <Panel
          title={data.forecast.method === 'budget_plan' ? 'Budget plan, coming quarters' : `Forecast (${data.forecast.method})`}
          description={
            <>
              Average quarter-over-quarter change in RR:{' '}
              <span className="num" style={{ color: 'var(--ink)' }}>
                {data.forecast.avg_quarterly_decline_rate.toFixed(2)}%
              </span>
            </>
          }
          flush
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quarter</th>
                  <th style={right}>Planned RR</th>
                  <th style={right}>Vs a year earlier</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast.quarters.map((quarter) => (
                  <tr key={quarter.quarter}>
                    <td className="font-medium">{quarter.quarter}</td>
                    <td className="num" style={right}>{money(quarter.forecasted_rr)}</td>
                    <td style={right}>
                      <SignedFigure
                        value={`${quarter.forecasted_dm_pct.toFixed(2)}%`}
                        good={quarter.forecasted_dm_pct >= 90}
                      />
                    </td>
                    <td>
                      <Badge variant={confidenceVariant[quarter.confidence as keyof typeof confidenceVariant] ?? 'default'}>
                        {quarter.confidence.charAt(0).toUpperCase() + quarter.confidence.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </section>
  )
}
