'use client'

/**
 * ActionPlanTab - Visual zigzag timeline + detailed actions table + key messages + escalation
 * Client Component — uses useState for status toggle interactivity
 * Matches Telstra HTML action-plan section exactly
 */

import { useState } from 'react'
import type { ActionItem, Stakeholder } from '@/lib/types/account-plan'

interface ActionPlanTabProps {
  actions: ActionItem[]
  stakeholders?: Stakeholder[]
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

const TIMELINE_PHASES = [
  {
    date: 'Days 1–30: IMMEDIATE ACTIONS',
    items: ['Map all current stakeholders and validate org structure', 'Re-engage existing champions and advocates immediately', 'Identify any champion departures or relationship gaps', 'Prepare executive briefing deck documenting current deployment value'],
  },
  {
    date: 'Days 31–60: RELATIONSHIP BUILDING',
    items: ['Executive briefing with primary decision makers (business reset alignment)', 'Technical roadmap presentation to IT/Product & Tech team', 'Renewal proposals to any upcoming contract renewals', 'ROI analysis document for CFO/Finance stakeholders'],
  },
  {
    date: 'Days 61–90: EXECUTION & EXPANSION',
    items: ['Annual Business Review with all stakeholders', 'Formal renewal negotiation with multi-year proposal', 'Main contract expansion proposal (upsell formalization)', 'Identify adjacent team or entity expansion opportunities'],
  },
  {
    date: 'Q3 ONWARDS: CRITICAL MILESTONES',
    items: ['Execute on expansion opportunities identified in 90-day plan', 'Quarterly Business Reviews on cadence', 'Review and refresh account plan based on outcomes'],
    isCritical: true,
  },
]

export function ActionPlanTab({ actions, stakeholders = [] }: ActionPlanTabProps) {
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionItem['status']>>(
    Object.fromEntries(actions.map(a => [a.id, a.status]))
  )

  const toggleStatus = (id: string) => {
    setActionStatuses(prev => ({
      ...prev,
      [id]: prev[id] === 'done' ? 'todo' : prev[id] === 'todo' ? 'in-progress' : 'done',
    }))
  }

  const priorityVariant = (p: string) => p === 'high' ? 'critical' : p === 'medium' ? 'high' : 'medium'
  const statusVariant = (s: string) => s === 'done' ? 'success' : s === 'in-progress' ? 'high' : 'neutral'

  // Champions for key messages
  const champions = stakeholders.filter(s => s.role === 'champion' || s.role === 'decision-maker').slice(0, 4)

  return (
    <div className="space-y-12">

      {/* Visual Zigzag Timeline */}
      <div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          30/60/90 Day Action Plan
        </h2>

        {/* Timeline */}
        <div style={{ position: 'relative', padding: '2rem 0', marginTop: '2rem' }}>
          {/* Center line */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'var(--border)', transform: 'translateX(-50%)' }} />

          {TIMELINE_PHASES.map((phase, i) => {
            const isOdd = i % 2 === 0
            return (
              <div key={i} style={{
                position: 'relative',
                marginBottom: '3rem',
                paddingLeft: isOdd ? '2rem' : 'calc(50% + 2rem)',
                paddingRight: isOdd ? 'calc(50% + 2rem)' : '2rem',
                textAlign: isOdd ? 'right' : 'left',
              }}>
                {/* Center dot */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '1rem',
                  width: '20px',
                  height: '20px',
                  background: phase.isCritical ? 'var(--critical, #e53935)' : 'var(--accent)',
                  border: '4px solid white',
                  borderRadius: '50%',
                  transform: 'translateX(-50%)',
                  boxShadow: '0 0 0 4px var(--border)',
                  zIndex: 1,
                }} />

                <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  borderLeft: isOdd ? 'none' : `3px solid ${phase.isCritical ? 'var(--critical, #e53935)' : 'var(--accent)'}`,
                  borderRight: isOdd ? `3px solid ${phase.isCritical ? 'var(--critical, #e53935)' : 'var(--accent)'}` : 'none',
                }}>
                  <div style={{
                    fontWeight: 700,
                    color: phase.isCritical ? 'var(--critical, #e53935)' : 'var(--accent)',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    fontFamily: '"Cormorant Garamond", serif',
                    letterSpacing: '0.01em',
                  }}>
                    {phase.date}
                  </div>
                  <ul style={{ margin: '0.5rem 0 0', paddingLeft: isOdd ? 0 : '1.25rem', paddingRight: isOdd ? '1.25rem' : 0, listStyle: isOdd ? 'none' : 'disc', fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--ink)' }}>
                    {phase.items.map((item, j) => (
                      <li key={j} style={{ marginBottom: '0.2rem' }}>
                        {isOdd ? `${item} •` : `• ${item}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed Action Items Table */}
      {actions.length > 0 && (
        <div>
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.25rem' }}>
            Detailed Action Items with Owners & Status
          </h3>
          <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                  {['Action', 'Owner', 'Target / Outcome', 'Timeline', 'Priority', 'Status'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map(action => {
                  const currentStatus = actionStatuses[action.id] ?? action.status
                  const isHighPri = action.priority === 'high'
                  return (
                    <tr key={action.id} style={{ borderBottom: '1px solid var(--border)', background: isHighPri ? 'rgba(229,57,53,0.05)' : 'transparent' }}>
                      <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--secondary)' }}>{action.title}</td>
                      <td style={{ padding: '1rem', color: 'var(--ink)', fontSize: '0.8rem' }}>{action.owner || '—'}</td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {action.description?.slice(0, 80) || '—'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem' }}>{action.dueDate || '—'}</td>
                      <td style={{ padding: '1rem' }}><Badge variant={priorityVariant(action.priority) as 'critical' | 'high' | 'medium'}>{action.priority}</Badge></td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => toggleStatus(action.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Click to cycle status"
                        >
                          <Badge variant={statusVariant(currentStatus) as 'success' | 'high' | 'neutral'}>{currentStatus.replace('-', ' ')}</Badge>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key Messages by Stakeholder */}
      {champions.length > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
            Key Messages by Stakeholder
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            {champions.map(s => (
              <div key={s.id} style={{ padding: '1.5rem', background: 'var(--highlight)', borderLeft: '3px solid var(--accent)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                  To {s.name} ({s.title || s.role})
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                  {s.keyMessage || `"Our platform delivers measurable value through faster operations, reduced errors, and improved productivity. We're committed to being a strategic partner in your success."`}
                </p>
              </div>
            ))}
            {/* Fill empty slots with generic messages */}
            {champions.length < 2 && (
              <div style={{ padding: '1.5rem', background: 'var(--highlight)', borderLeft: '3px solid var(--accent)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>To the Executive Team</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                  &quot;Our platform supports cost optimization while enabling growth through automation, reduced cycle times, and improved operational efficiency at scale.&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Escalation Triggers */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderLeft: '4px solid var(--critical, #e53935)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>
          ⚠️ Escalation Triggers to Skyvera Leadership
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>Escalate immediately if any of the following occur:</p>
        <ul style={{ marginLeft: '1.5rem', lineHeight: 2.2, fontSize: '0.9rem', color: 'var(--ink)' }}>
          <li>Executive meeting request denied or ignored after 60 days</li>
          <li>Competitive RFP announced for platform or equivalent systems</li>
          <li>Upcoming renewal discussions stall or turn negative</li>
          <li>Budget cuts threaten existing contract value</li>
          <li>Contact turnover exceeds 50% of known advocates</li>
          <li>Platform satisfaction score drops materially in QBR feedback</li>
        </ul>
      </div>

    </div>
  )
}
