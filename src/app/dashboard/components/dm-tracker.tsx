/**
 * DM% (Decline/Maintenance Rate) Tracker Component
 * Displays TTM DM% tracking and forecasting for all business units
 * DM% = (Current Year Revenue / Prior Year Revenue) × 100
 * Target: ≥90% (retain at least 90% of last year's revenue)
 */

import { getDMTrackerData } from '@/lib/data/server/dm-tracker-data'
import { AlertBox } from './alert-box'
import { DMTrendChart } from './dm-trend-chart'

export async function DMTracker() {
  const result = await getDMTrackerData()

  if (!result.success) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#64748b',
          background: '#f8fafc',
          borderRadius: '15px',
        }}
      >
        Failed to load DM% tracking data: {result.error.message}
      </div>
    )
  }

  const data = result.value

  return (
    <section id="dm-tracker" style={{ marginTop: '40px' }}>
      {/* Section Header */}
      <h2
        style={{
          fontSize: '1.8em',
          color: '#1e3c72',
          fontWeight: 'semibold' as any,
          margin: '30px 0 20px 0',
          paddingBottom: '10px',
          borderBottom: '3px solid #667eea',
        }}
      >
        DM% Tracking & Forecasting
      </h2>

      <div
        style={{
          fontSize: '0.95em',
          color: '#64748b',
          marginBottom: '20px',
          lineHeight: 1.6,
        }}
      >
        <strong>DM% (Decline/Maintenance Rate)</strong> measures revenue retention by
        comparing current period revenue to prior period. Target: ≥90%. Values below 90%
        indicate revenue contraction.
      </div>

      {/* Consolidated DM% Alert */}
      <AlertBox
        variant={data.consolidated.meets_target ? 'success' : 'critical'}
      >
        <div style={{ fontSize: '1.1em' }}>
          <strong>
            Consolidated DM%: {data.consolidated.dm_pct.toFixed(2)}%{' '}
            {data.consolidated.meets_target ? '(PASSING)' : '(FAILING)'}
          </strong>
        </div>
        <div style={{ marginTop: '10px', lineHeight: 1.7 }}>
          {data.consolidated.meets_target ? (
            <>
              Revenue retention is above target. Current quarter RR is $
              {(data.consolidated.current_rr / 1e6).toFixed(2)}M vs. prior period $
              {(data.consolidated.prior_rr / 1e6).toFixed(2)}M (variance: $
              {(data.consolidated.variance / 1e3).toFixed(0)}K).
            </>
          ) : (
            <>
              CRITICAL: Revenue retention below 90% target. Current quarter RR is $
              {(data.consolidated.current_rr / 1e6).toFixed(2)}M vs. prior period $
              {(data.consolidated.prior_rr / 1e6).toFixed(2)}M (variance: -$
              {Math.abs(data.consolidated.variance / 1e3).toFixed(0)}K). Immediate action
              required.
            </>
          )}
        </div>
      </AlertBox>

      {/* Business Unit Breakdown */}
      <h3
        style={{
          fontSize: '1.5em',
          fontWeight: 700,
          color: '#2a5298',
          marginTop: '30px',
          marginBottom: '15px',
          paddingBottom: '10px',
          borderBottom: '2px solid #e2e8f0',
        }}
      >
        Business Unit DM% Performance
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          margin: '20px 0',
        }}
      >
        {data.business_units.map((bu) => {
          const isSuccess = bu.meets_target
          const bgGradient = isSuccess
            ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'

          return (
            <div
              key={bu.bu}
              style={{
                background: bgGradient,
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                boxShadow: isSuccess
                  ? '0 4px 15px rgba(79, 172, 254, 0.4)'
                  : '0 4px 15px rgba(240, 147, 251, 0.4)',
              }}
            >
              <div style={{ fontSize: '0.85em', opacity: 0.9, marginBottom: '10px' }}>
                {bu.bu}
              </div>
              <div style={{ fontSize: '2.3em', fontWeight: 700 }}>
                {bu.dm_pct.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.8em', opacity: 0.85, marginTop: '5px' }}>
                {isSuccess ? 'PASSING' : 'FAILING'} • Target: ≥90%
              </div>
              <div
                style={{
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '0.85em',
                }}
              >
                <div style={{ marginBottom: '5px' }}>
                  Current RR: ${(bu.current_rr / 1e6).toFixed(2)}M
                </div>
                <div style={{ marginBottom: '5px' }}>
                  Prior RR: ${(bu.prior_rr / 1e6).toFixed(2)}M
                </div>
                <div>
                  Variance: {bu.variance >= 0 ? '+' : ''}$
                  {(bu.variance / 1e3).toFixed(0)}K
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detailed Table */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '15px',
          padding: '20px',
          margin: '20px 0',
          borderLeft: '5px solid #667eea',
        }}
      >
        <div
          style={{
            fontSize: '1.2em',
            fontWeight: 700,
            color: '#1e3c72',
            marginBottom: '15px',
          }}
        >
          DM% Detailed Breakdown
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <thead>
            <tr
              style={{
                background: '#1e3c72',
                color: 'white',
                textAlign: 'left' as const,
              }}
            >
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                Business Unit
              </th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                Current RR
              </th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                Prior RR
              </th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                DM%
              </th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                Variance
              </th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody style={{ background: 'white' }}>
            {data.business_units.map((bu, idx) => (
              <tr
                key={bu.bu}
                style={{
                  borderBottom:
                    idx < data.business_units.length - 1
                      ? '1px solid #e2e8f0'
                      : 'none',
                }}
              >
                <td style={{ padding: '12px', fontSize: '0.9em', fontWeight: 600 }}>
                  {bu.bu}
                </td>
                <td style={{ padding: '12px', fontSize: '0.9em' }}>
                  ${(bu.current_rr / 1e6).toFixed(2)}M
                </td>
                <td style={{ padding: '12px', fontSize: '0.9em' }}>
                  ${(bu.prior_rr / 1e6).toFixed(2)}M
                </td>
                <td
                  style={{
                    padding: '12px',
                    fontSize: '0.9em',
                    fontWeight: 700,
                    color: bu.meets_target ? '#10b981' : '#f5576c',
                  }}
                >
                  {bu.dm_pct.toFixed(2)}%
                </td>
                <td style={{ padding: '12px', fontSize: '0.9em' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '5px 12px',
                      borderRadius: '15px',
                      background: bu.variance >= 0 ? '#4facfe' : '#f5576c',
                      color: 'white',
                      fontSize: '0.8em',
                      fontWeight: 600,
                    }}
                  >
                    {bu.variance >= 0 ? '+' : ''}${(bu.variance / 1e3).toFixed(0)}K
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '0.9em' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '5px 12px',
                      borderRadius: '15px',
                      background: bu.meets_target ? '#10b981' : '#f5576c',
                      color: 'white',
                      fontSize: '0.8em',
                      fontWeight: 600,
                    }}
                  >
                    {bu.meets_target ? 'PASS' : 'FAIL'}
                  </span>
                </td>
              </tr>
            ))}
            {/* Consolidated Row */}
            <tr
              style={{
                borderTop: '2px solid #1e3c72',
                background: '#f8fafc',
                fontWeight: 700,
              }}
            >
              <td style={{ padding: '12px', fontSize: '0.9em' }}>
                CONSOLIDATED
              </td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>
                ${(data.consolidated.current_rr / 1e6).toFixed(2)}M
              </td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>
                ${(data.consolidated.prior_rr / 1e6).toFixed(2)}M
              </td>
              <td
                style={{
                  padding: '12px',
                  fontSize: '0.9em',
                  color: data.consolidated.meets_target ? '#10b981' : '#f5576c',
                }}
              >
                {data.consolidated.dm_pct.toFixed(2)}%
              </td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '5px 12px',
                    borderRadius: '15px',
                    background:
                      data.consolidated.variance >= 0 ? '#4facfe' : '#f5576c',
                    color: 'white',
                    fontSize: '0.8em',
                    fontWeight: 600,
                  }}
                >
                  {data.consolidated.variance >= 0 ? '+' : ''}$
                  {(data.consolidated.variance / 1e3).toFixed(0)}K
                </span>
              </td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '5px 12px',
                    borderRadius: '15px',
                    background: data.consolidated.meets_target
                      ? '#10b981'
                      : '#f5576c',
                    color: 'white',
                    fontSize: '0.8em',
                    fontWeight: 600,
                  }}
                >
                  {data.consolidated.meets_target ? 'PASS' : 'FAIL'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Trend Visualization */}
      <h3
        style={{
          fontSize: '1.5em',
          fontWeight: 700,
          color: '#2a5298',
          marginTop: '30px',
          marginBottom: '15px',
          paddingBottom: '10px',
          borderBottom: '2px solid #e2e8f0',
        }}
      >
        TTM DM% Trend & Forecast
      </h3>

      <DMTrendChart data={data} />

      {/* Forecast Summary */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '15px',
          padding: '20px',
          margin: '20px 0',
          borderLeft: '5px solid #667eea',
        }}
      >
        <div
          style={{
            fontSize: '1.2em',
            fontWeight: 700,
            color: '#1e3c72',
            marginBottom: '15px',
          }}
        >
          Forecast Analysis ({data.forecast.method})
        </div>
        <div style={{ lineHeight: 1.7, marginBottom: '15px' }}>
          <strong>Average Quarterly Decline Rate:</strong>{' '}
          {data.forecast.avg_quarterly_decline_rate.toFixed(2)}%
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <thead>
            <tr
              style={{
                background: '#1e3c72',
                color: 'white',
                textAlign: 'left' as const,
              }}
            >
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                Quarter
              </th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                Forecasted RR
              </th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                Forecasted DM%
              </th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>
                Confidence
              </th>
            </tr>
          </thead>
          <tbody style={{ background: 'white' }}>
            {data.forecast.quarters.map((quarter, idx) => (
              <tr
                key={quarter.quarter}
                style={{
                  borderBottom:
                    idx < data.forecast.quarters.length - 1
                      ? '1px solid #e2e8f0'
                      : 'none',
                }}
              >
                <td style={{ padding: '12px', fontSize: '0.9em', fontWeight: 600 }}>
                  {quarter.quarter}
                </td>
                <td style={{ padding: '12px', fontSize: '0.9em' }}>
                  ${(quarter.forecasted_rr / 1e6).toFixed(2)}M
                </td>
                <td
                  style={{
                    padding: '12px',
                    fontSize: '0.9em',
                    fontWeight: 700,
                    color: quarter.forecasted_dm_pct >= 90 ? '#10b981' : '#f5576c',
                  }}
                >
                  {quarter.forecasted_dm_pct.toFixed(2)}%
                </td>
                <td style={{ padding: '12px', fontSize: '0.9em' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '5px 12px',
                      borderRadius: '15px',
                      background:
                        quarter.confidence === 'high'
                          ? '#10b981'
                          : quarter.confidence === 'medium'
                          ? '#4facfe'
                          : '#fa709a',
                      color: 'white',
                      fontSize: '0.8em',
                      fontWeight: 600,
                      textTransform: 'uppercase' as const,
                    }}
                  >
                    {quarter.confidence}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
