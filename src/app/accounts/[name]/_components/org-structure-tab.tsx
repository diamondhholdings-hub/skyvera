/**
 * OrgStructureTab - Visual org-node hierarchy with decision hierarchy numbered list
 * Server Component — pure display, no interactivity needed
 * Matches Telstra HTML org-chart section: bordered cards, CEO style, target/advocate variants
 */

import type { Stakeholder } from '@/lib/types/account-plan'

interface OrgStructureTabProps {
  stakeholders: Stakeholder[]
  customerName: string
  bu: string
}

function OrgNode({ stakeholder }: { stakeholder: Stakeholder }) {
  const isChampion = stakeholder.role === 'champion'
  const isDecisionMaker = stakeholder.role === 'decision-maker'
  const isBlocker = stakeholder.role === 'blocker'

  const borderColor = isChampion ? 'var(--success, #4caf50)' : isDecisionMaker ? 'var(--accent)' : isBlocker ? 'var(--critical, #e53935)' : 'var(--secondary)'
  const borderWidth = isChampion || isDecisionMaker ? '3px' : '2px'
  const bgColor = isChampion ? 'rgba(76,175,80,0.05)' : isDecisionMaker ? 'rgba(200,75,49,0.04)' : 'white'

  const badgeLabel = { champion: 'INTERNAL ADVOCATE', 'decision-maker': 'KEY TARGET', influencer: 'INFLUENCER', blocker: 'POTENTIAL RISK', user: 'END USER' }[stakeholder.role] ?? ''
  const badgeBg = { champion: 'var(--success, #4caf50)', 'decision-maker': 'var(--critical, #e53935)', influencer: 'var(--warning, #ff9800)', blocker: 'var(--critical, #e53935)', user: 'var(--muted)' }[stakeholder.role] ?? 'var(--muted)'

  return (
    <div style={{
      background: bgColor,
      border: `${borderWidth} solid ${borderColor}`,
      padding: '1.25rem',
      margin: '0.5rem',
      borderRadius: '3px',
      minWidth: '220px',
      maxWidth: '260px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1rem', marginBottom: '0.25rem' }}>
        {stakeholder.title || stakeholder.role}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
        {stakeholder.name}
        {isChampion && ' ✅'}
        {isDecisionMaker && ' ⭐'}
      </div>
      <span style={{
        display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '2px',
        fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        background: badgeBg, color: 'white',
      }}>
        {badgeLabel}
      </span>
      {stakeholder.notes && (
        <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
          {stakeholder.notes.slice(0, 70)}{stakeholder.notes.length > 70 ? '…' : ''}
        </div>
      )}
    </div>
  )
}

export function OrgStructureTab({ stakeholders, customerName, bu }: OrgStructureTabProps) {
  if (stakeholders.length === 0) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>No org structure data</div>
        <p style={{ fontSize: '0.875rem' }}>Add stakeholder data with role classifications to visualize the org hierarchy.</p>
      </div>
    )
  }

  // Build hierarchy using reportsTo field
  const roots = stakeholders.filter(s => !s.reportsTo)
  const getChildren = (parentId: string) => stakeholders.filter(s => s.reportsTo === parentId)

  // Fallback: if no hierarchy info, group by role
  const useRoleGrouping = roots.length === 0

  const decisionMakers = stakeholders.filter(s => s.role === 'decision-maker')
  const champions = stakeholders.filter(s => s.role === 'champion')
  const influencers = stakeholders.filter(s => s.role === 'influencer')
  const users = stakeholders.filter(s => s.role === 'user')
  const blockers = stakeholders.filter(s => s.role === 'blocker')

  return (
    <div className="space-y-8">
      <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)' }}>
        {customerName} Organizational Structure
      </h2>
      <p style={{ fontSize: '1rem', color: 'var(--muted)', marginTop: '-1rem' }}>
        Decision-making hierarchy for {bu} platform systems. Green borders indicate primary engagement targets.
      </p>

      {/* Org chart */}
      <div style={{ padding: '2rem', background: 'var(--paper)', border: '1px solid var(--border)' }}>
        {useRoleGrouping ? (
          // Role-based grouping when no hierarchy data
          <>
            {decisionMakers.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '1rem', textAlign: 'center' }}>Decision Makers</div>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {decisionMakers.map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              </div>
            )}
            {champions.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '1rem', textAlign: 'center' }}>Champions & Advocates</div>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {champions.map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              </div>
            )}
            {influencers.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '1rem', textAlign: 'center' }}>Influencers</div>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {influencers.map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              </div>
            )}
            {(users.length > 0 || blockers.length > 0) && (
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '1rem', textAlign: 'center' }}>Operational / Other</div>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[...users, ...blockers].map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              </div>
            )}
          </>
        ) : (
          // Tree-based hierarchy from reportsTo
          <>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                {roots.map(s => <OrgNode key={s.id} stakeholder={s} />)}
              </div>
            </div>
            {roots.map(root => {
              const children = getChildren(root.id)
              if (children.length === 0) return null
              return (
                <div key={root.id} style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
                  {children.map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Decision Hierarchy */}
      <div style={{ padding: '1.5rem 2rem', background: 'rgba(200,75,49,0.05)', borderLeft: '4px solid var(--accent)' }}>
        <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>
          Decision Hierarchy for Platform Systems:
        </h4>
        <ol style={{ marginLeft: '1.5rem', lineHeight: 2, fontSize: '0.875rem', color: 'var(--ink)' }}>
          <li><strong>Level 1 — Strategic Direction:</strong> Decision Makers (business needs, strategic sponsorship)</li>
          <li><strong>Level 2 — Technical/Architectural:</strong> IT Function, platform teams, technical champions</li>
          <li><strong>Level 3 — Procurement & Budget:</strong> CFO/Finance, Chief Procurement Officer</li>
          <li><strong>Level 4 — Implementation & Ops:</strong> Internal advocates, business analysts, end users</li>
        </ol>
      </div>

    </div>
  )
}
