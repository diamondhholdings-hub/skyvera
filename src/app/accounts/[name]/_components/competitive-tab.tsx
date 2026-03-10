/**
 * CompetitiveTab - Full Telstra-style rebuild
 * Threat table + advantages metrics grid + defensive strategy + risk timeline
 * Server Component
 */

import type { Competitor } from '@/lib/types/account-plan'

interface CompetitiveTabProps {
  competitors: Competitor[]
}

function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: 'critical' | 'high' | 'medium' | 'success' | 'neutral' }) {
  const styles = {
    critical: { background: '#e53935', color: 'white' },
    high: { background: '#ff9800', color: 'white' },
    medium: { background: '#ffc107', color: '#1a1a1a' },
    success: { background: '#4caf50', color: 'white' },
    neutral: { background: '#8b8b8b', color: 'white' },
  }
  return (
    <span style={{ display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', ...styles[variant] }}>
      {children}
    </span>
  )
}

const STATIC_ADVANTAGES = [
  { label: 'Salesforce-Native', value: 'Built on Salesforce', description: 'Seamless with existing SF ecosystem, deep CRM integration, no middleware.' },
  { label: 'Telecom-Specific', value: 'Purpose-Built', description: 'Complex telecom bundles handled natively — not generic enterprise CPQ.' },
  { label: 'TM Forum Compliant', value: 'Open APIs', description: 'Aligns with autonomous network, composable architecture, open standards.' },
  { label: 'Full Quote-to-Cash', value: 'CPQ + Order Mgmt', description: 'End-to-end vs. CPQ-only competitors. Fewer integration points.' },
  { label: 'AI Roadmap', value: 'AI-Powered', description: 'AI-powered recommendations, predictive insights, intelligent automation.' },
  { label: 'Proven Track Record', value: '94% Retention', description: 'Industry-leading annual renewal rate reflecting consistent value delivery.' },
]

export function CompetitiveTab({ competitors }: CompetitiveTabProps) {
  const getThreatVariant = (c: Competitor): 'critical' | 'high' | 'medium' | 'neutral' => {
    if (c.threatLevel === 'critical') return 'critical'
    if (c.threatLevel === 'high' || c.type === 'both') return 'high'
    if (c.threatLevel === 'medium' || c.type === 'our-competitor') return 'medium'
    return 'neutral'
  }

  return (
    <div className="space-y-10">

      {/* Competitive Threats Table */}
      <div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          Competitive Landscape Analysis
        </h2>
        {competitors.length > 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                  {['Competitor', 'Threat Level', 'Customer Sponsor', 'Differentiators', 'Weaknesses', 'Next Action'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, i) => {
                  const threatVariant = getThreatVariant(comp)
                  const isHighThreat = threatVariant === 'critical' || threatVariant === 'high'
                  return (
                    <tr key={comp.id ?? i} style={{ borderBottom: '1px solid var(--border)', background: isHighThreat ? 'rgba(255,152,0,0.06)' : 'transparent' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--secondary)' }}>{comp.name}</td>
                      <td style={{ padding: '1rem' }}><Badge variant={threatVariant}>{comp.threatLevel ?? (comp.type === 'both' ? 'HIGH' : comp.type === 'our-competitor' ? 'MEDIUM' : 'LOW')}</Badge></td>
                      <td style={{ padding: '1rem', color: 'var(--ink)', fontSize: '0.8rem' }}>{comp.customerSponsor || '—'}</td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                        {comp.weaknesses.length > 0 ? comp.weaknesses.slice(0, 2).map((w, j) => <div key={j}>• {w}</div>) : '—'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                        {comp.strengths.length > 0 ? comp.strengths.slice(0, 2).map((s, j) => <div key={j}>• {s}</div>) : '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {comp.nextActionToDefend
                          ? <><Badge variant={isHighThreat ? 'high' : 'medium'}>Q1&apos;26</Badge><div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{comp.nextActionToDefend}</div></>
                          : <span style={{ color: 'var(--muted)' }}>Monitor</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'white', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            No competitive intelligence available yet.
          </div>
        )}
      </div>

      {/* Competitive Advantages Metrics Grid */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
          Our Competitive Advantages
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {STATIC_ADVANTAGES.map(({ label, value, description }) => (
            <div key={label} style={{ background: 'var(--highlight)', padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.4rem' }}>{label}</div>
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.3rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.5rem' }}>{value}</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Defensive Strategy */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>
          Defensive Strategy & Competitive Positioning
        </h3>
        <ol style={{ marginLeft: '1.5rem', lineHeight: 2.2, fontSize: '0.9rem', color: 'var(--ink)' }}>
          <li><strong>Strengthen Platform Positioning:</strong> Emphasize native integration depth and telecom-specific capabilities that generic competitors cannot match.</li>
          <li><strong>Demonstrate Business Alignment:</strong> Position platform as enabler of faster sales, simpler quotes, fewer errors — directly supporting customer cost reduction goals.</li>
          <li><strong>Present AI Roadmap:</strong> Highlight AI-powered capabilities and composable architecture alignment with customer technology direction.</li>
          <li><strong>Expand Footprint Before Review Cycles:</strong> Drive adoption and usage before any competitive evaluation, creating switching costs beyond technology.</li>
          <li><strong>Build Multi-Threaded Relationships:</strong> Executive relationships that survive contact turnover create strategic moats.</li>
        </ol>
      </div>

    </div>
  )
}
