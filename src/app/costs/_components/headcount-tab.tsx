/**
 * Headcount: aggregated groups only. The snapshot holds no individual people
 * and this tab must never show any.
 */
import { Info } from 'lucide-react'
import type { HeadcountGroup, IntelligenceSnapshot } from '@/lib/data/server/intelligence-data'
import { pctChangeLabel, usd, usdSigned } from './format'
import { Panel, ShareBar, right } from './ui'
import type { CostSummary } from './cost-summary'

function fmtHeads(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function GroupTable({
  title,
  label,
  groups,
  quarter,
  totalCost,
}: {
  title: string
  label: string
  groups: HeadcountGroup[]
  quarter: string
  totalCost: number
}) {
  const rows = groups.slice().sort((a, b) => (b.cost[quarter] ?? 0) - (a.cost[quarter] ?? 0))
  return (
    <Panel title={title} flush>
      <div className="overflow-x-auto">
        <table className="data-table" style={{ minWidth: '440px' }}>
          <thead>
            <tr>
              <th scope="col">{label}</th>
              <th scope="col" style={right}>Heads</th>
              <th scope="col" style={right}>{quarter} cost</th>
              <th scope="col" style={right}>Per head</th>
              <th scope="col" style={right}>Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const cost = g.cost[quarter] ?? 0
              const share = totalCost ? (cost / totalCost) * 100 : 0
              const heads = g.averageHeadcount || g.headcount
              return (
                <tr key={g.name}>
                  <td>{g.name}</td>
                  <td className="num" style={right}>{fmtHeads(g.headcount)}</td>
                  <td className="num" style={right}>{usd(cost)}</td>
                  <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{heads ? usd(cost / heads) : '$0'}</td>
                  <td style={right}>
                    <span className="inline-flex items-center gap-2">
                      <ShareBar share={share} />
                      <span className="num">{share.toFixed(1)}%</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function HeadcountTab({ intel, summary }: { intel: IntelligenceSnapshot; summary: CostSummary }) {
  const hc = intel.headcount
  const quarter = hc.quarters[0]
  const totalCost = hc.total.cost[quarter] ?? 0
  const summaryRows = Object.entries(hc.summary)
  const teams = hc.teams.slice().sort((a, b) => b.cost - a.cost)
  const teamTotals = teams.reduce(
    (t, r) => ({
      headcount: t.headcount + r.headcount,
      cost: t.cost + r.cost,
      priorHeadcount: t.priorHeadcount + r.priorQuarterHeadcount,
      priorCost: t.priorCost + r.priorQuarterCost,
    }),
    { headcount: 0, cost: 0, priorHeadcount: 0, priorCost: 0 }
  )

  return (
    <div className="space-y-6">
      <p className="m-0 flex items-start gap-2 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Aggregated from the {quarter} headcount budget. Groups and teams only, no individual records.
        Costs are per quarter. Cost per head is <span className="num">{usd(summary.costPerHead)}</span>, using
        average headcount ({fmtHeads(summary.averageHeadcount)}).
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Quarter summary" description="End-of-quarter headcount and cost against the prior quarter." flush>
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '520px' }}>
              <thead>
                <tr>
                  <th scope="col">Line</th>
                  <th scope="col" style={right}>Heads</th>
                  <th scope="col" style={right}>Prior heads</th>
                  <th scope="col" style={right}>{quarter} cost</th>
                  <th scope="col" style={right}>Prior quarter cost</th>
                  <th scope="col" style={right}>Change</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map(([name, s]) => {
                  const hasHeads = s.headcountEndOfQuarter !== 0 || s.priorQuarterHeadcount !== 0
                  return (
                    <tr key={name}>
                      <td className={name.startsWith('Total') ? 'font-medium' : undefined}>{name}</td>
                      <td className="num" style={right}>{hasHeads ? fmtHeads(s.headcountEndOfQuarter) : ''}</td>
                      <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{hasHeads ? fmtHeads(s.priorQuarterHeadcount) : ''}</td>
                      <td className="num" style={right}>{usd(s.cost)}</td>
                      <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(s.priorQuarterCost)}</td>
                      <td className="num whitespace-nowrap" style={right}>{usdSigned(s.cost - s.priorQuarterCost)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Forward quarters"
          description={`Budgeted headcount cost. ${hc.plannedTerminations} planned terminations are in the plan.`}
          flush
        >
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '360px' }}>
              <thead>
                <tr>
                  <th scope="col">Quarter</th>
                  <th scope="col" style={right}>Headcount cost</th>
                  <th scope="col" style={right}>Adjustments</th>
                  <th scope="col" style={right}>Change vs {quarter}</th>
                </tr>
              </thead>
              <tbody>
                {hc.quarters.map((q) => {
                  const cost = hc.total.cost[q] ?? 0
                  const adj = hc.adjustments.reduce((s, a) => s + (a.cost[q] ?? 0), 0)
                  return (
                    <tr key={q}>
                      <td>{q}</td>
                      <td className="num" style={right}>{usd(cost)}</td>
                      <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usdSigned(adj)}</td>
                      <td className="num whitespace-nowrap" style={right}>
                        {q === quarter ? '' : `${usdSigned(cost - totalCost)} (${pctChangeLabel(cost, totalCost)})`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GroupTable title="By department" label="Department" groups={hc.byDepartment} quarter={quarter} totalCost={totalCost} />
        <GroupTable title="By business unit" label="Business unit" groups={hc.byVertical} quarter={quarter} totalCost={totalCost} />
        <GroupTable title="COGS vs OPEX" label="Cost type" groups={hc.byCostType} quarter={quarter} totalCost={totalCost} />
        <GroupTable title="By employment type" label="Employment" groups={hc.byEmployment} quarter={quarter} totalCost={totalCost} />
      </div>

      <GroupTable title="By location" label="Country" groups={hc.byLocation} quarter={quarter} totalCost={totalCost} />

      <Panel title="Teams" description={`${teams.length} teams, ${quarter} against the prior quarter.`} flush>
        <div className="overflow-x-auto">
          <table className="data-table" style={{ minWidth: '720px' }}>
            <thead>
              <tr>
                <th scope="col">Team</th>
                <th scope="col">Cost type</th>
                <th scope="col" style={right}>Heads</th>
                <th scope="col" style={right}>Prior heads</th>
                <th scope="col" style={right}>{quarter} cost</th>
                <th scope="col" style={right}>Prior quarter cost</th>
                <th scope="col" style={right}>Change</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => {
                const delta = t.headcount - t.priorQuarterHeadcount
                return (
                  <tr key={t.team}>
                    <td className="font-medium">{t.team}</td>
                    <td style={{ color: 'var(--ink-2)' }}>{t.category ?? ''}</td>
                    <td className="num" style={right}>
                      {fmtHeads(t.headcount)}
                      {delta !== 0 && (
                        <span className="ml-1 text-xs" style={{ color: 'var(--muted)' }}>
                          ({delta > 0 ? '+' : '−'}{fmtHeads(Math.abs(delta))})
                        </span>
                      )}
                    </td>
                    <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{fmtHeads(t.priorQuarterHeadcount)}</td>
                    <td className="num" style={right}>{usd(t.cost)}</td>
                    <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(t.priorQuarterCost)}</td>
                    <td className="num whitespace-nowrap" style={right}>{usdSigned(t.cost - t.priorQuarterCost)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2} style={{ textAlign: 'left' }}>Total</th>
                <td className="num" style={right}>{fmtHeads(teamTotals.headcount)}</td>
                <td className="num" style={right}>{fmtHeads(teamTotals.priorHeadcount)}</td>
                <td className="num" style={right}>{usd(teamTotals.cost)}</td>
                <td className="num" style={right}>{usd(teamTotals.priorCost)}</td>
                <td className="num" style={right}>{usdSigned(teamTotals.cost - teamTotals.priorCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>

      <Panel
        title="Adjustments"
        description="Charges and credits outside the headcount lines, such as allocations and hire fees, listed separately from the group and team figures."
        flush
      >
        <div className="overflow-x-auto">
          <table className="data-table" style={{ minWidth: '640px' }}>
            <thead>
              <tr>
                <th scope="col">Adjustment</th>
                <th scope="col">Business unit</th>
                {hc.quarters.map((q) => (
                  <th key={q} scope="col" style={right}>{q}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hc.adjustments.map((a, i) => (
                <tr key={`${a.description}-${i}`}>
                  <td className="font-medium">{a.description}</td>
                  <td style={{ color: 'var(--ink-2)' }}>{a.vertical ?? 'Unassigned'}</td>
                  {hc.quarters.map((q) => (
                    <td key={q} className="num" style={right}>{usdSigned(a.cost[q] ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
