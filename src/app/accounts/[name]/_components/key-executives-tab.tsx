'use client'

/**
 * KeyExecutivesTab - 4-quadrant decision matrix + expandable executive accordions + relationship table
 * Client Component — uses useState for accordion open/close state
 * Matches Telstra HTML: decision-matrix, expandable sections, relationship actions table
 */

import { useState } from 'react'
import type { Stakeholder } from '@/lib/types/account-plan'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface KeyExecutivesTabProps {
  stakeholders: Stakeholder[]
}

function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: 'critical' | 'high' | 'medium' | 'success' | 'neutral' }) {
  const styles: Record<string, React.CSSProperties> = {
    critical: { background: '#e53935', color: 'white' },
    high: { background: '#ff9800', color: 'white' },
    medium: { background: '#ffc107', color: '#1a1a1a' },
    success: { background: '#4caf50', color: 'white' },
    neutral: { background: 'var(--muted)', color: 'white' },
  }
  return (
    <span style={{
      display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: '2px',
      fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      ...styles[variant],
    }}>
      {children}
    </span>
  )
}

function ExecutiveAccordion({ stakeholder, defaultOpen = false }: { stakeholder: Stakeholder; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const isHighPriority = stakeholder.role === 'champion' || stakeholder.role === 'decision-maker'

  const roleLabel = {
    'champion': 'Internal Champion',
    'decision-maker': 'Decision Maker',
    'influencer': 'Influencer',
    'user': 'End User',
    'blocker': 'Potential Blocker',
  }[stakeholder.role] ?? stakeholder.role

  const roleVariant = {
    'champion': 'success' as const,
    'decision-maker': 'critical' as const,
    'influencer': 'high' as const,
    'user': 'neutral' as const,
    'blocker': 'critical' as const,
  }[stakeholder.role] ?? 'neutral' as const

  const relVariant = {
    'strong': 'success' as const,
    'moderate': 'medium' as const,
    'weak': 'critical' as const,
    'unknown': 'neutral' as const,
  }[stakeholder.relationshipStrength] ?? 'neutral' as const

  return (
    <div style={{
      border: '1px solid var(--border)',
      marginBottom: '0.75rem',
      background: 'white',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '1.25rem 1.5rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600,
          fontSize: '1rem',
          color: 'var(--secondary)',
          background: open ? 'var(--highlight)' : 'white',
          transition: 'background 0.2s ease',
          borderLeft: isHighPriority ? '4px solid var(--accent)' : '4px solid transparent',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'var(--highlight)' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'white' }}
      >
        <span>
          {isHighPriority ? '🎯 ' : ''}{stakeholder.name}
          {stakeholder.title && <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.875rem' }}>— {stakeholder.title}</span>}
        </span>
        {open ? <ChevronUp size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
      </div>

      {open && (
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Profile table */}
            <div>
              <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.75rem' }}>Profile</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                  {[
                    { label: 'Title', value: stakeholder.title || '—' },
                    { label: 'Role', value: <Badge variant={roleVariant}>{roleLabel}</Badge> },
                    { label: 'Relationship', value: <Badge variant={relVariant}>{stakeholder.relationshipStrength}</Badge> },
                    ...(stakeholder.tenure ? [{ label: 'Tenure', value: stakeholder.tenure }] : []),
                    ...(stakeholder.email ? [{ label: 'Email', value: stakeholder.email }] : []),
                    ...(stakeholder.lastInteraction ? [{ label: 'Last Contact', value: stakeholder.lastInteraction }] : []),
                  ].map(({ label, value }) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem 1rem 0.6rem 0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', fontWeight: 600, width: '8rem' }}>{label}</td>
                      <td style={{ padding: '0.6rem 0', color: 'var(--ink)' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Strategic context */}
            <div>
              <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.75rem' }}>Strategic Context</h4>
              {stakeholder.interests && stakeholder.interests.length > 0 && (
                <ul style={{ marginLeft: '1.25rem', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--ink)' }}>
                  {stakeholder.interests.map((interest, i) => (
                    <li key={i}>{interest}</li>
                  ))}
                </ul>
              )}
              {stakeholder.notes && (
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {stakeholder.notes}
                </p>
              )}
              {stakeholder.keyMessage && (
                <div style={{ padding: '1rem', background: 'var(--highlight)', borderLeft: '3px solid var(--accent)', marginTop: '0.5rem' }}>
                  <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem', color: 'var(--secondary)' }}>Key Message:</strong>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink)', margin: 0 }}>{stakeholder.keyMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function KeyExecutivesTab({ stakeholders }: KeyExecutivesTabProps) {
  // Quadrant classification
  const supporterDMs = stakeholders.filter(s => s.role === 'champion' || (s.role === 'decision-maker' && s.relationshipStrength !== 'weak'))
  const detractorDMs = stakeholders.filter(s => s.role === 'blocker' || (s.role === 'decision-maker' && s.relationshipStrength === 'weak'))
  const supporterInfluencers = stakeholders.filter(s => s.role === 'influencer' && s.relationshipStrength !== 'weak')
  const detractorInfluencers = stakeholders.filter(s => s.role === 'influencer' && s.relationshipStrength === 'weak')

  // Sort: champions + decision-makers first for accordion
  const sortedForAccordion = [...stakeholders].sort((a, b) => {
    const order = { 'champion': 0, 'decision-maker': 1, 'influencer': 2, 'user': 3, 'blocker': 4 }
    return (order[a.role] ?? 5) - (order[b.role] ?? 5)
  })

  if (stakeholders.length === 0) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>No stakeholders mapped</div>
        <p style={{ fontSize: '0.875rem' }}>Add stakeholder data to the account plan JSON to see the executive map.</p>
      </div>
    )
  }

  const QuadrantBox = ({ title, items, borderColor, bgColor }: { title: string; items: Stakeholder[]; borderColor: string; bgColor: string }) => (
    <div style={{ border: `2px solid ${borderColor}`, padding: '1.5rem', minHeight: '160px', background: bgColor }}>
      <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${borderColor}`, color: 'var(--secondary)' }}>
        {title}
      </h4>
      {items.length > 0 ? items.map(s => (
        <div key={s.id} style={{ display: 'inline-block', background: 'white', border: '1px solid var(--border)', padding: '0.4rem 0.9rem', margin: '0.2rem', borderRadius: '3px', fontSize: '0.875rem' }}>
          <strong>{s.name}</strong>
          {s.title && <><br /><small style={{ color: 'var(--muted)' }}>{s.title}</small></>}
        </div>
      )) : (
        <p style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.875rem' }}>None identified</p>
      )}
    </div>
  )

  return (
    <div className="space-y-10">

      {/* Decision Maker & Influencer Matrix */}
      <div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          Decision Maker & Influencer Analysis
        </h2>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <QuadrantBox title="✅ Supporter & Decision Maker" items={supporterDMs} borderColor="var(--success, #4caf50)" bgColor="rgba(76,175,80,0.05)" />
            <QuadrantBox title="⚠️ Detractor & Decision Maker" items={detractorDMs} borderColor="var(--critical, #e53935)" bgColor="rgba(229,57,53,0.05)" />
            <QuadrantBox title="✅ Supporter & Influencer" items={supporterInfluencers} borderColor="#81c784" bgColor="rgba(76,175,80,0.02)" />
            <QuadrantBox title="⚠️ Detractor & Influencer" items={detractorInfluencers} borderColor="#ef5350" bgColor="rgba(229,57,53,0.02)" />
          </div>
        </div>
      </div>

      {/* Executive Deep Dive Accordions */}
      <div>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
          Executive Deep Dive
        </h3>
        {sortedForAccordion.map((s, i) => (
          <ExecutiveAccordion key={s.id} stakeholder={s} defaultOpen={i === 0} />
        ))}
      </div>

      {/* Relationship Actions Table */}
      <div>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.25rem' }}>
          Relationship Actions — Next 30/60/90 Days
        </h3>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                {['Name', 'Title / Role', 'Decision / Influence', 'Status', 'Next Action', 'Timeline'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedForAccordion.map((s, i) => {
                const isHighPri = s.role === 'champion' || s.role === 'decision-maker' || s.role === 'blocker'
                const timeline = i === 0 ? 'Week 1' : i < 3 ? 'Days 1–30' : i < 5 ? 'Days 31–60' : 'Days 61–90'
                const timelineVariant = i === 0 ? 'critical' : i < 3 ? 'high' : 'medium'
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: isHighPri ? 'rgba(229,57,53,0.05)' : 'transparent' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--secondary)' }}>{s.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--muted)' }}>{s.title || '—'}</td>
                    <td style={{ padding: '1rem', color: 'var(--ink)' }}>{s.role.replace('-', ' ')}</td>
                    <td style={{ padding: '1rem' }}>
                      <Badge variant={{ strong: 'success', moderate: 'medium', weak: 'critical', unknown: 'neutral' }[s.relationshipStrength] as 'success' | 'medium' | 'critical' | 'neutral'}>
                        {s.relationshipStrength}
                      </Badge>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--ink)', fontSize: '0.8rem' }}>
                      {s.notes?.slice(0, 80) || `Engage and build relationship`}
                    </td>
                    <td style={{ padding: '1rem' }}><Badge variant={timelineVariant as 'critical' | 'high' | 'medium'}>{timeline}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
