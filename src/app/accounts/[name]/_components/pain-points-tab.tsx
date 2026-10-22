'use client'

/**
 * PainPointsTab - pain points table + strategic opportunities table
 * Client Component: status column uses StatusCycleButton for inline editing
 */

import { useState } from 'react'
import type { PainPoint, Opportunity } from '@/lib/types/account-plan'
import { StatusCycleButton } from '@/components/ui/status-cycle-button'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

interface PainPointsTabProps {
  painPoints: PainPoint[]
  opportunities: Opportunity[]
  accountName?: string
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function PainPointsTab({ painPoints, opportunities, accountName = '' }: PainPointsTabProps) {
  const [localPainPoints, setLocalPainPoints] = useState(painPoints)

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setLocalPainPoints(prev => prev.map(pp => pp.id === id ? { ...pp, status: newStatus as PainPoint['status'] } : pp))
  }

  return (
    <div className="space-y-6">

      {/* Pain Points Table */}
      {painPoints.length > 0 && (
        <section className="card overflow-hidden" aria-labelledby="pp-title">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 id="pp-title" className="m-0">Customer pain points and platform alignment</h2>
            <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>Select a status to cycle it. Changes save to the account plan.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th scope="col">Identified pain</th>
                  <th scope="col">Customer owner</th>
                  <th scope="col">Urgency</th>
                  <th scope="col">Status</th>
                  <th scope="col">Platform solution</th>
                  <th scope="col">Next action</th>
                </tr>
              </thead>
              <tbody>
                {localPainPoints.map((pp, i) => {
                  const urgencyVariant = pp.severity === 'high' ? 'danger' : pp.severity === 'medium' ? 'warning' : 'default'
                  return (
                    <tr key={pp.id ?? i} style={{ verticalAlign: 'top' }}>
                      <td style={{ maxWidth: '18rem' }}>
                        <span className="block font-medium">{pp.title}</span>
                        {pp.description && <span className="mt-0.5 block text-xs" style={{ color: 'var(--muted)' }}>{pp.description.slice(0, 80)}{pp.description.length > 80 ? '…' : ''}</span>}
                      </td>
                      <td className="text-[0.8125rem]">{pp.owner || '—'}</td>
                      <td>{pp.severity ? <Badge variant={urgencyVariant}>{capitalize(pp.severity)}</Badge> : '—'}</td>
                      <td>
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
                      <td className="text-[0.8125rem]" style={{ color: 'var(--ink-2)', maxWidth: '18rem' }}>
                        {pp.cloudSenseSolution || 'Platform capabilities address this pain point'}
                      </td>
                      <td className="text-[0.8125rem]" style={{ color: 'var(--ink-2)', maxWidth: '16rem' }}>
                        {pp.nextAction || <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Strategic opportunities */}
      {opportunities.length > 0 && (
        <section className="card overflow-hidden" aria-labelledby="opp-title">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 id="opp-title" className="m-0">Strategic initiatives and opportunities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '720px' }}>
              <thead>
                <tr>
                  <th scope="col">Opportunity</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Potential value</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Probability</th>
                  <th scope="col">Relevance</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp, i) => {
                  const relevance = opp.probability && opp.probability > 70
                    ? { label: 'High', variant: 'success' as const }
                    : opp.probability && opp.probability > 40
                      ? { label: 'Medium', variant: 'warning' as const }
                      : { label: 'Exploring', variant: 'default' as const }
                  return (
                    <tr key={opp.id ?? i} style={{ verticalAlign: 'top' }}>
                      <td style={{ maxWidth: '36rem' }}>
                        <span className="block font-medium">{opp.title}</span>
                        <span className="mt-0.5 block text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>{opp.description}</span>
                      </td>
                      <td className="num whitespace-nowrap" style={{ textAlign: 'right' }}>
                        {opp.estimatedValue ? `$${(opp.estimatedValue / 1000).toFixed(0)}K` : '—'}
                      </td>
                      <td className="num" style={{ textAlign: 'right' }}>
                        {opp.probability != null ? `${opp.probability}%` : '—'}
                      </td>
                      <td><Badge variant={relevance.variant}>{relevance.label}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Empty state */}
      {painPoints.length === 0 && opportunities.length === 0 && (
        <EmptyState
          title="No pain points mapped"
          description="Pain points and opportunities appear here as account data is enriched."
        />
      )}

    </div>
  )
}
