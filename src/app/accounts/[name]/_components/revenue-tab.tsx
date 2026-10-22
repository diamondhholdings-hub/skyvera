/**
 * RevenueTab - renewals, Salesforce renewal pipeline, receivables over 90 days
 * and non-recurring revenue lines for one customer, from the intelligence
 * snapshot (getCustomerIntelligence). Server Component: no event handlers;
 * the collection note expands with a native <details>.
 */

import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { KpiStrip } from '@/components/ui/kpi-strip'
import {
  getCustomerIntelligence,
  getIntelligence,
  isAtRiskRenewal,
  quarterOrder,
} from '@/lib/data/server/intelligence-data'

interface RevenueTabProps {
  customerName: string
}

const tagClass = 'inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 text-xs font-medium'
const tagStyle = { borderRadius: 'var(--radius-xs)' }
const right = { textAlign: 'right' as const }

function usd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

function shortUsd(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return usd(value)
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Not set'
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function signedPct(value: number): string {
  if (!value) return '0%'
  return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`
}

function WillRenewTag({ value }: { value: string | null }) {
  if (isAtRiskRenewal({ willRenew: value })) {
    return (
      <span className={`${tagClass} badge-critical`} style={tagStyle}>
        <CircleAlert className="h-3 w-3" aria-hidden="true" />
        {value}, at risk
      </span>
    )
  }
  if (value === 'Yes') {
    return (
      <span className={`${tagClass} badge-success`} style={tagStyle}>
        <CircleCheck className="h-3 w-3" aria-hidden="true" />
        Yes
      </span>
    )
  }
  return <span style={{ color: 'var(--muted)' }}>{value ?? 'Not set'}</span>
}

function YesNo({ value, riskWhen }: { value: boolean; riskWhen: boolean }) {
  const risky = value === riskWhen
  return (
    <span className={`${tagClass} ${risky ? 'badge-critical' : 'badge-success'}`} style={tagStyle}>
      {risky
        ? <CircleAlert className="h-3 w-3" aria-hidden="true" />
        : <CircleCheck className="h-3 w-3" aria-hidden="true" />}
      {value ? 'Yes' : 'No'}
    </span>
  )
}

function Panel({ id, title, caption, children }: { id: string; title: string; caption?: string; children: ReactNode }) {
  return (
    <section className="card overflow-hidden" aria-labelledby={id}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 id={id} className="m-0">{title}</h2>
        {caption && <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>{caption}</p>}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 px-5 py-6 text-sm" style={{ color: 'var(--muted)' }}>{children}</p>
  )
}

export function RevenueTab({ customerName }: RevenueTabProps) {
  const intel = getCustomerIntelligence(customerName)
  const nrrQuarters = getIntelligence()?.nrr.quarters ?? []

  const renewals = [...intel.renewals].sort(
    (a, b) => quarterOrder(a.renewalQuarter ?? '') - quarterOrder(b.renewalQuarter ?? '')
  )
  const pipeline = [...intel.pipeline].sort((a, b) => (a.closeDate ?? '').localeCompare(b.closeDate ?? ''))
  const receivable = intel.receivable
  const nrr = intel.nrr

  const totalArr = renewals.reduce((s, r) => s + r.arr, 0)
  const totalProjected = renewals.reduce((s, r) => s + r.projectedArr, 0)
  const atRiskArr = renewals.filter(isAtRiskRenewal).reduce((s, r) => s + r.arr, 0)
  const nrrNext4 = nrr.reduce((s, l) => s + nrrQuarters.reduce((q, k) => q + (l.byQuarter[k] ?? 0), 0), 0)
  const notes = receivable?.latestNote
    ? receivable.latestNote.split(/\s*===\s*/).map((n) => n.trim()).filter(Boolean)
    : []

  return (
    <div className="space-y-6">
      {/* Wrapped: KpiStrip sets an inline margin:0 that would cancel space-y */}
      <div>
        <KpiStrip
          items={[
            {
              label: 'Subscription ARR',
              value: shortUsd(totalArr),
              context: `${renewals.length} subscription${renewals.length === 1 ? '' : 's'}, projected ${shortUsd(totalProjected)}`,
            },
            {
              label: 'ARR at risk',
              value: shortUsd(atRiskArr),
              context: atRiskArr > 0 ? 'Marked as not renewing' : 'No subscription marked as not renewing',
              tone: atRiskArr > 0 ? 'critical' : 'default',
            },
            {
              label: 'AR over 90 days',
              value: shortUsd(receivable?.arOver90 ?? 0),
              context: receivable
                ? receivable.arOver10PctOfArr ? 'Over 10% of ARR' : 'Under 10% of ARR'
                : 'No aged receivables',
              tone: receivable?.arOver10PctOfArr ? 'critical' : 'default',
            },
            {
              label: 'Non-recurring, next 4 quarters',
              value: shortUsd(nrrNext4),
              context: `${nrr.length} line${nrr.length === 1 ? '' : 's'} in the budget`,
            },
          ]}
        />
      </div>

      <Panel id="rev-renewals" title="Subscriptions and renewals" caption="Renewal schedule from the budget workbook">
        {renewals.length === 0 ? (
          <Empty>No subscriptions in the renewal schedule for this account.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '760px' }}>
              <thead>
                <tr>
                  <th scope="col">Subscription</th>
                  <th scope="col">Renewal quarter</th>
                  <th scope="col">Renewal date</th>
                  <th scope="col" style={right}>ARR</th>
                  <th scope="col">Will renew</th>
                  <th scope="col" style={right}>Up/down-sell</th>
                  <th scope="col" style={right}>Projected ARR</th>
                </tr>
              </thead>
              <tbody>
                {renewals.map((r) => (
                  <tr key={r.subscriptionId}>
                    <td className="num font-medium">{r.subscriptionId}</td>
                    <td>{r.renewalQuarter ?? 'Not set'}</td>
                    <td className="num" style={{ color: 'var(--ink-2)' }}>{formatDate(r.renewalDate)}</td>
                    <td className="num" style={right}>{usd(r.arr)}</td>
                    <td><WillRenewTag value={r.willRenew} /></td>
                    <td className="num" style={right}>{signedPct(r.upDownSellPct)}</td>
                    <td className="num" style={right}>{usd(r.projectedArr)}</td>
                  </tr>
                ))}
              </tbody>
              {renewals.length > 1 && (
                <tfoot>
                  <tr style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
                    <td colSpan={3} className="font-semibold">Total</td>
                    <td className="num font-semibold" style={right}>{usd(totalArr)}</td>
                    <td colSpan={2} />
                    <td className="num font-semibold" style={right}>{usd(totalProjected)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Panel>

      <Panel id="rev-pipeline" title="Renewal opportunities" caption="Renewal opportunities from Salesforce">
        {pipeline.length === 0 ? (
          <Empty>No Salesforce renewal opportunities for this account.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th scope="col">Opportunity</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Renewal date</th>
                  <th scope="col">Close date</th>
                  <th scope="col">Owner</th>
                  <th scope="col" style={right}>Probability</th>
                  <th scope="col" style={right}>Current ARR</th>
                  <th scope="col" style={right}>Renewal ARR</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.map((p) => {
                  const change = p.currentArr ? ((p.arr - p.currentArr) / p.currentArr) * 100 : 0
                  return (
                    <tr key={p.opportunityId}>
                      <td className="font-medium" style={{ maxWidth: '22rem' }}>{p.opportunity ?? p.opportunityId}</td>
                      <td>{p.stage ?? 'Not set'}</td>
                      <td className="num" style={{ color: 'var(--ink-2)' }}>{formatDate(p.renewalDate)}</td>
                      <td className="num" style={{ color: 'var(--ink-2)' }}>{formatDate(p.closeDate)}</td>
                      <td>{p.owner ?? 'Unassigned'}</td>
                      <td className="num" style={right}>{Math.round(p.probabilityPct)}%</td>
                      <td className="num" style={right}>{usd(p.currentArr)}</td>
                      <td className="num" style={right}>
                        {usd(p.arr)}
                        {p.currentArr > 0 && change !== 0 && (
                          <span className="ml-1.5 text-xs" style={{ color: change > 0 ? 'var(--success-ink)' : 'var(--critical-ink)' }}>
                            {signedPct(change)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel id="rev-receivables" title="Receivables over 90 days" caption="AR aging from the budget workbook">
        {!receivable ? (
          <Empty>No receivables over 90 days for this account.</Empty>
        ) : (
          <div className="p-5">
            <dl className="m-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="section-label">Balance over 90 days</dt>
                <dd className="num m-0 mt-1 text-lg font-semibold">{usd(receivable.arOver90)}</dd>
              </div>
              <div>
                <dt className="section-label">ARR in budget</dt>
                <dd className="num m-0 mt-1 text-lg font-semibold">{usd(receivable.arrInBudget)}</dd>
              </div>
              <div>
                <dt className="section-label">Over 10% of ARR</dt>
                <dd className="m-0 mt-1.5"><YesNo value={receivable.arOver10PctOfArr} riskWhen={true} /></dd>
              </div>
              <div>
                <dt className="section-label">Revenue included in budget</dt>
                <dd className="m-0 mt-1.5">
                  <span className={`${tagClass} ${receivable.revenueInBudget ? 'badge-info' : 'badge-warning'}`} style={tagStyle}>
                    {receivable.revenueInBudget ? 'Yes' : 'No, excluded'}
                  </span>
                </dd>
              </div>
            </dl>

            {receivable.buComments && (
              <p className="m-0 mt-5 text-sm" style={{ color: 'var(--ink-2)' }}>
                <span className="section-label">BU comment: </span>
                {receivable.buComments.replace(/\s+/g, ' ').trim()}
              </p>
            )}

            {notes.length > 0 ? (
              <details className="mt-4 rev-note">
                <summary className="text-sm font-medium">Latest collection note</summary>
                <div className="mt-3 space-y-3">
                  {notes.map((note, i) => (
                    <p key={i} className="m-0 text-sm" style={{ color: 'var(--ink-2)' }}>{note}</p>
                  ))}
                </div>
              </details>
            ) : (
              <p className="m-0 mt-4 text-sm" style={{ color: 'var(--muted)' }}>No collection note recorded.</p>
            )}
          </div>
        )}
      </Panel>

      <Panel id="rev-nrr" title="Non-recurring revenue" caption="Services and license lines in the budget">
        {nrr.length === 0 ? (
          <Empty>No non-recurring revenue lines for this account.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '760px' }}>
              <thead>
                <tr>
                  <th scope="col">Class</th>
                  <th scope="col">Department</th>
                  <th scope="col" style={right}>Trailing 12 months</th>
                  {nrrQuarters.map((q) => (
                    <th key={q} scope="col" style={right}>{q}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nrr.map((line, i) => (
                  <tr key={`${line.class}-${line.department}-${i}`}>
                    <td className="font-medium">{line.class ?? 'Unclassified'}</td>
                    <td>{line.department ?? 'Not set'}</td>
                    <td className="num" style={right}>{usd(line.trailing12Months)}</td>
                    {nrrQuarters.map((q) => (
                      <td key={q} className="num" style={right}>{usd(line.byQuarter[q] ?? 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <style>{`
        .rev-note summary { cursor: pointer; color: var(--secondary); }
        .rev-note summary:hover { text-decoration: underline; text-underline-offset: 2px; }
      `}</style>
    </div>
  )
}
