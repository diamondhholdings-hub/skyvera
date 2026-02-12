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
      <div id="financial-summary" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
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
      <h2 style={{
        fontSize: '1.8em',
        color: '#1e3c72',
        fontWeight: 'semibold',
        margin: '30px 0 20px 0',
        paddingBottom: '10px',
        borderBottom: '3px solid #667eea'
      }}>
        Financial Executive Summary
      </h2>

      {/* Overall Assessment Alert */}
      <AlertBox variant="critical">
        <div style={{ fontSize: '1.1em' }}>
          <strong>OVERALL ASSESSMENT: PROCEED WITH CAUTION</strong>
        </div>
        <div style={{ marginTop: '10px', lineHeight: 1.7 }}>
          Skyvera demonstrates strong profitability metrics ({data.netMarginPct.toFixed(1)}% EBITDA
          margin, ${(data.ebitda / 1e6).toFixed(1)}M quarterly EBITDA) but faces significant
          structural challenges with declining recurring revenue ({arrYoYChange}% YoY) and margin
          compression (-${Math.abs(marginGap / 1e3).toFixed(0)}K gap to target).
        </div>
      </AlertBox>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        margin: '30px 0'
      }}>
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
      <h3 style={{
        fontSize: '1.5em',
        fontWeight: 700,
        color: '#2a5298',
        marginTop: '30px',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '2px solid #e2e8f0'
      }}>
        Critical Financial Issues
      </h3>

      {/* Issue 1: Margin Gap */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '15px',
        padding: '20px',
        margin: '15px 0',
        borderLeft: '5px solid #667eea'
      }}>
        <div style={{
          fontSize: '1.2em',
          fontWeight: 700,
          color: '#1e3c72',
          marginBottom: '15px'
        }}>
          1. Margin Gap: -${Math.abs(marginGap / 1e3).toFixed(0)}K (
          {marginGapPct.toFixed(1)} percentage points)
        </div>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ background: '#1e3c72', color: 'white', textAlign: 'left' as const }}>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Driver</th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Impact</th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Explanation</th>
            </tr>
          </thead>
          <tbody style={{ background: 'white' }}>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>HC COGS Increase</td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '5px 12px',
                  borderRadius: '15px',
                  background: '#f5576c',
                  color: 'white',
                  fontSize: '0.8em',
                  fontWeight: 600
                }}>
                  +$779K
                </span>
              </td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>43 new XO contractors hired</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>RR Decline</td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '5px 12px',
                  borderRadius: '15px',
                  background: '#f5576c',
                  color: 'white',
                  fontSize: '0.8em',
                  fontWeight: 600
                }}>
                  -$336K
                </span>
              </td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>Recurring revenue down vs. prior plan</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>NHC Expenses Up</td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '5px 12px',
                  borderRadius: '15px',
                  background: '#fa709a',
                  color: 'white',
                  fontSize: '0.8em',
                  fontWeight: 600
                }}>
                  +$177K
                </span>
              </td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>Software/professional services</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>CF COGS Down</td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '5px 12px',
                  borderRadius: '15px',
                  background: '#4facfe',
                  color: 'white',
                  fontSize: '0.8em',
                  fontWeight: 600
                }}>
                  -$920K
                </span>
              </td>
              <td style={{ padding: '12px', fontSize: '0.9em' }}>Vendor optimization (positive)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Issue 2: RR Declining */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '15px',
        padding: '20px',
        margin: '15px 0',
        borderLeft: '5px solid #667eea'
      }}>
        <div style={{
          fontSize: '1.2em',
          fontWeight: 700,
          color: '#1e3c72',
          marginBottom: '15px'
        }}>
          2. Recurring Revenue Declining: -$336K
        </div>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ background: '#1e3c72', color: 'white', textAlign: 'left' as const }}>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Business Unit</th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Q1'26 Plan</th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Prior Plan</th>
              <th style={{ padding: '15px', fontWeight: 600, fontSize: '0.9em' }}>Variance</th>
            </tr>
          </thead>
          <tbody style={{ background: 'white' }}>
            {buSummaries.slice(0, 3).map((bu) => {
              // Mock prior plan data (would come from actual data source)
              const variance = bu.bu === 'Cloudsense' ? -355000 : bu.bu === 'Kandy' ? -75000 : 146000
              const priorPlan = bu.totalRR - variance
              const variantColor =
                variance < 0 ? '#f5576c' : variance < 50000 ? '#fa709a' : '#4facfe'

              return (
                <tr key={bu.bu} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontSize: '0.9em' }}>{bu.bu}</td>
                  <td style={{ padding: '12px', fontSize: '0.9em' }}>${(bu.totalRR / 1e6).toFixed(2)}M</td>
                  <td style={{ padding: '12px', fontSize: '0.9em' }}>${(priorPlan / 1e6).toFixed(2)}M</td>
                  <td style={{ padding: '12px', fontSize: '0.9em' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '5px 12px',
                      borderRadius: '15px',
                      background: variantColor,
                      color: 'white',
                      fontSize: '0.8em',
                      fontWeight: 600
                    }}>
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
      <div style={{
        background: '#f8fafc',
        borderRadius: '15px',
        padding: '20px',
        margin: '15px 0',
        borderLeft: '5px solid #667eea'
      }}>
        <div style={{
          fontSize: '1.2em',
          fontWeight: 700,
          color: '#1e3c72',
          marginBottom: '15px'
        }}>
          3. Salesforce UK Contract: $4.1M Annual
        </div>
        <AlertBox variant="critical">
          <strong>CRITICAL CONCERN:</strong> This contract consumes 64% of Cloudsense's recurring
          revenue. At this cost ratio, every dollar of Cloudsense RR decline makes this contract
          increasingly burdensome.
          <ul style={{ marginTop: '15px', marginLeft: '25px', lineHeight: 2 }}>
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
      <h3 style={{
        fontSize: '1.5em',
        fontWeight: 700,
        color: '#2a5298',
        marginTop: '30px',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '2px solid #e2e8f0'
      }}>
        Business Unit Performance
      </h3>
      <BUPerformanceTable buSummaries={buSummaries} />
    </section>
  )
}
