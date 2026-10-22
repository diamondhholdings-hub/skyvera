'use client'

/**
 * KeyExecutivesTab - 4-quadrant decision matrix + expandable executive profiles + relationship table
 * Client Component: uses useState for accordion open/close state
 */

import { useState } from 'react'
import type { Stakeholder } from '@/lib/types/account-plan'
import { ChevronDown, CircleCheck, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

interface KeyExecutivesTabProps {
  stakeholders: Stakeholder[]
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'

const relVariantMap: Record<string, BadgeVariant> = {
  strong: 'success',
  moderate: 'warning',
  weak: 'danger',
  unknown: 'default',
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function ExecutiveAccordion({ stakeholder, defaultOpen = false }: { stakeholder: Stakeholder; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const isHighPriority = stakeholder.role === 'champion' || stakeholder.role === 'decision-maker'
  const panelId = `exec-panel-${stakeholder.id}`

  const roleLabel = {
    'champion': 'Internal champion',
    'decision-maker': 'Decision maker',
    'influencer': 'Influencer',
    'user': 'End user',
    'blocker': 'Potential blocker',
  }[stakeholder.role] ?? stakeholder.role

  const roleVariant: BadgeVariant = {
    'champion': 'success' as const,
    'decision-maker': 'default' as const,
    'influencer': 'default' as const,
    'user': 'default' as const,
    'blocker': 'danger' as const,
  }[stakeholder.role] ?? 'default'

  const relVariant = relVariantMap[stakeholder.relationshipStrength] ?? 'default'

  return (
    <div className="exec-accordion">
      <h3 className="m-0 text-base">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={panelId}
          className="exec-accordion-trigger flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
        >
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-semibold" style={{ color: 'var(--ink)' }}>{stakeholder.name}</span>
            {stakeholder.title && <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>{stakeholder.title}</span>}
            {isHighPriority && <Badge>Key contact</Badge>}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform duration-150"
            style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : undefined }}
            aria-hidden="true"
          />
        </button>
      </h3>

      {open && (
        <div id={panelId} className="px-5 pb-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile */}
            <div>
              <h4 className="m-0 mb-2">Profile</h4>
              <dl className="m-0 text-sm">
                {[
                  { label: 'Title', value: stakeholder.title || '—' },
                  { label: 'Role', value: <Badge variant={roleVariant}>{roleLabel}</Badge> },
                  { label: 'Relationship', value: <Badge variant={relVariant}>{capitalize(stakeholder.relationshipStrength)}</Badge> },
                  ...(stakeholder.tenure ? [{ label: 'Tenure', value: stakeholder.tenure }] : []),
                  ...(stakeholder.email ? [{ label: 'Email', value: stakeholder.email }] : []),
                  ...(stakeholder.lastInteraction ? [{ label: 'Last contact', value: stakeholder.lastInteraction }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <dt className="w-28 shrink-0" style={{ color: 'var(--muted)' }}>{label}</dt>
                    <dd className="m-0 min-w-0 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Strategic context */}
            <div>
              <h4 className="m-0 mb-2">Strategic context</h4>
              {stakeholder.interests && stakeholder.interests.length > 0 && (
                <ul className="m-0 mb-3 list-disc space-y-1 pl-5 text-sm">
                  {stakeholder.interests.map((interest, i) => (
                    <li key={i}>{interest}</li>
                  ))}
                </ul>
              )}
              {stakeholder.notes && (
                <p className="m-0 mb-3 text-sm" style={{ color: 'var(--ink-2)' }}>
                  {stakeholder.notes}
                </p>
              )}
              {stakeholder.keyMessage && (
                <div className="p-3 text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <p className="m-0 text-xs font-medium" style={{ color: 'var(--muted)' }}>Key message</p>
                  <p className="m-0 mt-1">{stakeholder.keyMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuadrantBox({ title, items, tone }: { title: string; items: Stakeholder[]; tone: 'supporter' | 'detractor' }) {
  const Icon = tone === 'supporter' ? CircleCheck : TriangleAlert
  const color = tone === 'supporter' ? 'var(--success-ink)' : 'var(--critical-ink)'
  return (
    <div className="p-4" style={{ background: 'var(--surface)', minHeight: '9rem' }}>
      <h3 className="m-0 flex items-center gap-1.5 text-sm">
        <Icon className="h-4 w-4 shrink-0" style={{ color }} aria-hidden="true" />
        {title}
        <span className="num font-normal" style={{ color: 'var(--muted)' }}>({items.length})</span>
      </h3>
      {items.length > 0 ? (
        <ul className="m-0 mt-3 list-none space-y-2 p-0 text-sm">
          {items.map(s => (
            <li key={s.id}>
              <span className="font-medium">{s.name}</span>
              {s.title && <span className="block text-xs" style={{ color: 'var(--muted)' }}>{s.title}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 mt-3 text-sm" style={{ color: 'var(--muted)' }}>None identified</p>
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
      <EmptyState
        title="No stakeholders mapped"
        description="Add stakeholder data to the account plan to see the executive map."
      />
    )
  }

  return (
    <div className="space-y-6">

      {/* Decision Maker & Influencer Matrix */}
      <section className="card overflow-hidden" aria-labelledby="exec-matrix">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="exec-matrix" className="m-0">Decision makers and influencers</h2>
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>Stakeholders grouped by influence and stance toward Skyvera.</p>
        </div>
        <div className="grid gap-px sm:grid-cols-2" style={{ background: 'var(--border)' }}>
          <QuadrantBox title="Supporter, decision maker" items={supporterDMs} tone="supporter" />
          <QuadrantBox title="Detractor, decision maker" items={detractorDMs} tone="detractor" />
          <QuadrantBox title="Supporter, influencer" items={supporterInfluencers} tone="supporter" />
          <QuadrantBox title="Detractor, influencer" items={detractorInfluencers} tone="detractor" />
        </div>
      </section>

      {/* Executive Deep Dive Accordions */}
      <section aria-labelledby="exec-deep-dive">
        <h2 id="exec-deep-dive" className="m-0 mb-3">Executive profiles</h2>
        <div className="card overflow-hidden">
          {sortedForAccordion.map((s, i) => (
            <ExecutiveAccordion key={s.id} stakeholder={s} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      {/* Relationship Actions Table */}
      <section className="card overflow-hidden" aria-labelledby="exec-actions">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="exec-actions" className="m-0">Relationship actions for the next 90 days</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table" style={{ minWidth: '760px' }}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Title</th>
                <th scope="col">Role</th>
                <th scope="col">Relationship</th>
                <th scope="col">Next action</th>
                <th scope="col">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {sortedForAccordion.map((s, i) => {
                const timeline = i === 0 ? 'Week 1' : i < 3 ? 'Days 1–30' : i < 5 ? 'Days 31–60' : 'Days 61–90'
                return (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td style={{ color: 'var(--ink-2)' }}>{s.title || '—'}</td>
                    <td style={{ color: 'var(--ink-2)' }}>{capitalize(s.role.replace('-', ' '))}</td>
                    <td>
                      <Badge variant={relVariantMap[s.relationshipStrength] ?? 'default'}>
                        {capitalize(s.relationshipStrength)}
                      </Badge>
                    </td>
                    <td className="text-[0.8125rem]">
                      {s.notes?.slice(0, 80) || 'Engage and build relationship'}
                    </td>
                    <td className="num whitespace-nowrap" style={{ color: i === 0 ? 'var(--ink)' : 'var(--ink-2)', fontWeight: i === 0 ? 600 : 400 }}>{timeline}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .exec-accordion + .exec-accordion { border-top: 1px solid var(--border); }
        .exec-accordion-trigger { background: transparent; border: 0; cursor: pointer; font: inherit; transition: background-color 150ms var(--ease-out); }
        .exec-accordion-trigger:hover { background: var(--highlight); }
        .exec-accordion-trigger:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
      `}</style>
    </div>
  )
}
