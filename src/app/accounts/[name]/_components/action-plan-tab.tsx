'use client'

/**
 * ActionPlanTab - 30/60/90 day plan + detailed actions table + key messages + escalation
 * Client Component: uses useState for status toggle interactivity
 */

import { useState } from 'react'
import type { ActionItem, Stakeholder } from '@/lib/types/account-plan'
import { StatusCycleButton } from '@/components/ui/status-cycle-button'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Badge } from '@/components/ui/badge'
import { TriangleAlert } from 'lucide-react'

interface ActionPlanTabProps {
  actions: ActionItem[]
  stakeholders?: Stakeholder[]
  accountName?: string
}

const TIMELINE_PHASES = [
  {
    date: 'Days 1–30',
    title: 'Immediate actions',
    items: ['Map all current stakeholders and validate org structure', 'Re-engage existing champions and advocates immediately', 'Identify any champion departures or relationship gaps', 'Prepare executive briefing deck documenting current deployment value'],
  },
  {
    date: 'Days 31–60',
    title: 'Relationship building',
    items: ['Executive briefing with primary decision makers (business reset alignment)', 'Technical roadmap presentation to IT/Product & Tech team', 'Renewal proposals to any upcoming contract renewals', 'ROI analysis document for CFO/Finance stakeholders'],
  },
  {
    date: 'Days 61–90',
    title: 'Execution and expansion',
    items: ['Annual Business Review with all stakeholders', 'Formal renewal negotiation with multi-year proposal', 'Main contract expansion proposal (upsell formalization)', 'Identify adjacent team or entity expansion opportunities'],
  },
  {
    date: 'After day 90',
    title: 'Critical milestones',
    items: ['Execute on expansion opportunities identified in 90-day plan', 'Quarterly Business Reviews on cadence', 'Review and refresh account plan based on outcomes'],
    isCritical: true,
  },
]

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function ActionPlanTab({ actions, stakeholders = [], accountName = '' }: ActionPlanTabProps) {
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionItem['status']>>(
    Object.fromEntries(actions.map(a => [a.id, a.status]))
  )

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setActionStatuses(prev => ({ ...prev, [id]: newStatus as ActionItem['status'] }))
  }

  const priorityVariant = (p: string) => p === 'high' ? 'danger' as const : p === 'medium' ? 'warning' as const : 'default' as const

  // Champions for key messages
  const champions = stakeholders.filter(s => s.role === 'champion' || s.role === 'decision-maker').slice(0, 4)

  return (
    <div className="space-y-6">

      {/* 30/60/90 day plan */}
      <section className="card overflow-hidden" aria-labelledby="ap-plan">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="ap-plan" className="m-0">30/60/90 day action plan</h2>
        </div>
        <ol className="m-0 grid list-none gap-px p-0 md:grid-cols-2 xl:grid-cols-4" style={{ background: 'var(--border)' }}>
          {TIMELINE_PHASES.map((phase) => (
            <li key={phase.date} className="p-5" style={{ background: 'var(--surface)' }}>
              <p className="num m-0 text-[0.8125rem] font-medium" style={{ color: phase.isCritical ? 'var(--critical-ink)' : 'var(--muted)' }}>
                {phase.date}
              </p>
              <h3 className="m-0 mt-0.5">{phase.title}</h3>
              <ul className="m-0 mt-3 list-disc space-y-1.5 pl-4 text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>
                {phase.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* Detailed Action Items Table */}
      {actions.length > 0 && (
        <section className="card overflow-hidden" aria-labelledby="ap-items">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 id="ap-items" className="m-0">Action items, owners and status</h2>
            <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>Select a status to cycle it. Changes save to the account plan.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '820px' }}>
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Target or outcome</th>
                  <th scope="col">Due</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {actions.map(action => {
                  const currentStatus = actionStatuses[action.id] ?? action.status
                  return (
                    <tr key={action.id} style={{ verticalAlign: 'top' }}>
                      <td className="font-medium" style={{ maxWidth: '18rem' }}>{action.title}</td>
                      <td className="text-[0.8125rem]">{action.owner || '—'}</td>
                      <td className="text-[0.8125rem]" style={{ color: 'var(--ink-2)', maxWidth: '18rem' }}>
                        {action.description?.slice(0, 80) || '—'}
                      </td>
                      <td className="num whitespace-nowrap text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>{action.dueDate || '—'}</td>
                      <td><Badge variant={priorityVariant(action.priority)}>{capitalize(action.priority)}</Badge></td>
                      <td>
                        <ErrorBoundary>
                          <StatusCycleButton
                            id={action.id}
                            status={currentStatus}
                            statuses={['todo', 'in-progress', 'done']}
                            accountName={accountName}
                            type="action"
                            onUpdate={(s) => handleStatusUpdate(action.id, s)}
                          />
                        </ErrorBoundary>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Key Messages by Stakeholder */}
        {champions.length > 0 && (
          <section className="card p-5" aria-labelledby="ap-messages">
            <h2 id="ap-messages" className="m-0">Key messages by stakeholder</h2>
            <dl className="m-0 mt-3">
              {champions.map((s, i) => (
                <div key={s.id} className="py-3" style={{ borderTop: i ? '1px solid var(--border)' : undefined }}>
                  <dt className="text-sm font-medium">
                    To {s.name} <span className="font-normal" style={{ color: 'var(--muted)' }}>({s.title || s.role})</span>
                  </dt>
                  <dd className="m-0 mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
                    {s.keyMessage || `"Our platform delivers measurable value through faster operations, reduced errors, and improved productivity. We're committed to being a strategic partner in your success."`}
                  </dd>
                </div>
              ))}
              {/* Fill empty slots with generic messages */}
              {champions.length < 2 && (
                <div className="py-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <dt className="text-sm font-medium">To the executive team</dt>
                  <dd className="m-0 mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
                    &quot;Our platform supports cost optimization while enabling growth through automation, reduced cycle times, and improved operational efficiency at scale.&quot;
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Escalation Triggers */}
        <section className="card p-5" aria-labelledby="ap-escalation">
          <h2 id="ap-escalation" className="m-0 flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 shrink-0" style={{ color: 'var(--warning-ink)' }} aria-hidden="true" />
            Escalation triggers to Skyvera leadership
          </h2>
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>Escalate immediately if any of the following occur:</p>
          <ul className="m-0 mt-3 list-disc space-y-1.5 pl-5 text-sm">
            <li>Executive meeting request denied or ignored after 60 days</li>
            <li>Competitive RFP announced for platform or equivalent systems</li>
            <li>Upcoming renewal discussions stall or turn negative</li>
            <li>Budget cuts threaten existing contract value</li>
            <li>Contact turnover exceeds 50% of known advocates</li>
            <li>Platform satisfaction score drops materially in QBR feedback</li>
          </ul>
        </section>
      </div>

    </div>
  )
}
