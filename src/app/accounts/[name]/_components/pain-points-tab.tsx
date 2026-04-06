'use client'

/**
 * PainPointsTab - 6-column pain points table + strategic initiatives cards
 * Client Component — status column uses StatusCycleButton for inline editing
 * Matches Telstra HTML pain-points section
 */

import { useState } from 'react'
import type { PainPoint, Opportunity } from '@/lib/types/account-plan'
import { StatusCycleButton } from '@/components/ui/status-cycle-button'
import { ErrorBoundary } from '@/components/ui/error-boundary'

interface PainPointsTabProps {
  painPoints: PainPoint[]
  opportunities: Opportunity[]
  accountName?: string
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'critical' | 'high' | 'medium' | 'success' | 'neutral' }) {
  const styles = {
    critical: { background: '#e53935', color: 'white' },
    high: { background: '#ff9800', color: 'white' },
    medium: { background: '#ffc107', color: '#1a1a1a' },
    success: { background: '#4caf50', color: 'white' },
    neutral: { background: '#8b8b8b', color: 'white' },
  }
  return (
    <span style={{
      display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: '2px',
      fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      ...styles[variant],
    }}>
      {children}
    </span>
  )
}

export function PainPointsTab({ painPoints, opportunities, accountName = '' }: PainPointsTabProps) {
  const [localPainPoints, setLocalPainPoints] = useState(painPoints)

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setLocalPainPoints(prev => prev.map(pp => pp.id === id ? { ...pp, status: newStatus as PainPoint['status'] } : pp))
  }

  return (
    <div className="space-y-10">

      {/* Pain Points Table */}
      {painPoints.length > 0 && (
        <div>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
            Customer Pain Points & Platform Alignment
          </h2>
          <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                  {['Identified Pain', 'Customer Owner', 'Urgency', 'Budget?', 'Platform Solution', 'Next Action'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localPainPoints.map((pp, i) => {
                  const isHigh = pp.severity === 'high'
                  const urgencyVariant = pp.severity === 'high' ? 'critical' : pp.severity === 'medium' ? 'high' : 'medium'
                  return (
                    <tr key={pp.id ?? i} style={{ borderBottom: '1px solid var(--border)', background: isHigh ? 'rgba(229,57,53,0.06)' : 'transparent' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong style={{ color: 'var(--secondary)', display: 'block', marginBottom: '0.2rem' }}>{pp.title}</strong>
                        {pp.description && <small style={{ color: 'var(--muted)' }}>{pp.description.slice(0, 80)}{pp.description.length > 80 ? '…' : ''}</small>}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--ink)', fontSize: '0.8rem' }}>{pp.owner || '—'}</td>
                      <td style={{ padding: '1rem' }}><Badge variant={urgencyVariant as 'critical' | 'high' | 'medium'}>{pp.severity?.toUpperCase()}</Badge></td>
                      <td style={{ padding: '1rem' }}>
                        <ErrorBoundary>
                          <StatusCycleButton
                            id={pp.id}
                            status={pp.status}
                            statuses={['active', 'monitoring', 'resolved']}
                            accountName={accountName}
                            type="pain-point"
                            onUpdate={(s) => handleStatusUpdate(pp.id, s)}
                          />
                        </ErrorBoundary>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {pp.cloudSenseSolution || 'Platform capabilities address this pain point'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {pp.nextAction
                          ? <><Badge variant={isHigh ? 'critical' : 'high'}>Q1&apos;26</Badge><div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{pp.nextAction}</div></>
                          : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategic Initiatives — opportunities as cards */}
      {opportunities.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
            Strategic Initiatives & Opportunities
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {opportunities.map((opp, i) => {
              const relevanceBadge = opp.probability && opp.probability > 70 ? { label: 'HIGH Relevance', variant: 'critical' } : opp.probability && opp.probability > 40 ? { label: 'MEDIUM Relevance', variant: 'high' } : { label: 'EXPLORING', variant: 'neutral' }
              return (
                <div key={opp.id ?? i} style={{ background: 'white', border: '1px solid var(--border)', padding: '2rem', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.3s ease' }}>
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.5rem' }}>{opp.title}</h3>
                  {opp.estimatedValue && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                      <strong>Value: </strong>${(opp.estimatedValue / 1000).toFixed(0)}K potential
                      {opp.probability != null && <span> · {opp.probability}% probability</span>}
                    </p>
                  )}
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {opp.description}
                  </p>
                  <Badge variant={relevanceBadge.variant as 'critical' | 'high' | 'neutral'}>{relevanceBadge.label}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {painPoints.length === 0 && opportunities.length === 0 && (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>No pain points mapped</div>
          <p style={{ fontSize: '0.875rem' }}>Pain points and opportunities will appear as account data is enriched.</p>
        </div>
      )}

    </div>
  )
}
