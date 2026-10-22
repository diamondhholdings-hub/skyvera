import { groupSum, type IntelligenceSnapshot } from '@/lib/data/server/intelligence-data'
import { EmptyState } from '@/components/ui/empty-state'
import { pctChangeLabel, usd, usdSigned } from './format'
import { BUFilter, Panel, right } from './ui'
import type { CostSummary } from './cost-summary'

type Line = IntelligenceSnapshot['centralFunctions']['lines'][number]

function ChangeCell({ current, base }: { current: number; base: number }) {
  return (
    <td className="num whitespace-nowrap" style={right}>
      {usdSigned(current - base)}
      <span className="block text-xs" style={{ color: 'var(--muted)' }}>{pctChangeLabel(current, base)}</span>
    </td>
  )
}

/** Grouped rows with every period summed, largest current-quarter first */
function groupPeriods(lines: Line[], key: (l: Line) => string | null, periods: string[], current: string) {
  return groupSum(lines, key, (l) => l.cost[current] ?? 0).map((g) => {
    const rows = lines.filter((l) => (key(l) ?? 'Unassigned') === g.name)
    const byPeriod: Record<string, number> = {}
    for (const p of periods) byPeriod[p] = rows.reduce((s, l) => s + (l.cost[p] ?? 0), 0)
    return { name: g.name, count: g.count, byPeriod }
  })
}

export function CentralTab({
  intel,
  summary,
  bus,
  bu,
}: {
  intel: IntelligenceSnapshot
  summary: CostSummary
  bus: string[]
  bu: string | null
}) {
  const { periods } = intel.centralFunctions
  const { centralPeriod: current, centralBudgetPeriod: budget, centralPriorPeriod: forecast } = summary
  const forward = periods.slice(periods.indexOf(current) + 1)
  const allLines = intel.centralFunctions.lines
  const cfBUs = bus.filter((b) => allLines.some((l) => l.bu === b))
  const lines = bu ? allLines.filter((l) => l.bu === bu) : allLines

  const byGroup = groupPeriods(lines, (l) => l.group, periods, current)
  const byBU = groupPeriods(allLines, (l) => l.bu, periods, current)
  const detail = lines.slice().sort((a, b) => (b.cost[current] ?? 0) - (a.cost[current] ?? 0))
  const total = (p: string, rows: Line[] = lines) => rows.reduce((s, l) => s + (l.cost[p] ?? 0), 0)

  const head = (first: string) => (
    <thead>
      <tr>
        <th scope="col">{first}</th>
        <th scope="col" style={right}>{budget}</th>
        <th scope="col" style={right}>{forecast}</th>
        <th scope="col" style={right}>{current}</th>
        <th scope="col" style={right}>Change vs {budget}</th>
        {forward.map((p) => (
          <th key={p} scope="col" style={right}>{p}</th>
        ))}
      </tr>
    </thead>
  )

  const groupTable = (rows: ReturnType<typeof groupPeriods>, first: string, scope: Line[]) => (
    <div className="overflow-x-auto">
      <table className="data-table" style={{ minWidth: '820px' }}>
        {head(first)}
        <tbody>
          {rows.map((g) => (
            <tr key={g.name}>
              <th scope="row" className="font-medium" style={{ textAlign: 'left', background: 'transparent' }}>{g.name}</th>
              <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(g.byPeriod[budget])}</td>
              <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(g.byPeriod[forecast])}</td>
              <td className="num font-medium" style={right}>{usd(g.byPeriod[current])}</td>
              <ChangeCell current={g.byPeriod[current]} base={g.byPeriod[budget]} />
              {forward.map((p) => (
                <td key={p} className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(g.byPeriod[p])}</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" style={{ textAlign: 'left' }}>Total</th>
            <td className="num" style={right}>{usd(total(budget, scope))}</td>
            <td className="num" style={right}>{usd(total(forecast, scope))}</td>
            <td className="num" style={right}>{usd(total(current, scope))}</td>
            <ChangeCell current={total(current, scope)} base={total(budget, scope)} />
            {forward.map((p) => (
              <td key={p} className="num" style={right}>{usd(total(p, scope))}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <BUFilter tab="central" bus={cfBUs} active={bu} />
        <p className="m-0 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
          <span className="num">{lines.length}</span> charges · {bu ?? 'all business units'} · {current} vs {budget}
        </p>
      </div>

      {lines.length === 0 ? (
        <EmptyState title="No central charges for this unit" description="Choose another business unit or show all units." />
      ) : (
        <>
          <Panel
            title="By service group"
            description={`Central-function charges${bu ? ` to ${bu}` : ''}, ${current} against the ${budget} and ${forecast}.`}
            flush
          >
            {groupTable(byGroup, 'Service group', lines)}
          </Panel>

          {!bu && (
            <Panel title="By business unit" description="Which unit each central charge lands on." flush>
              {groupTable(byBU, 'Business unit', allLines)}
            </Panel>
          )}

          <Panel title="Charges" description={`Every central service line, sorted by ${current} cost.`} flush>
            <div className="overflow-x-auto">
              <table className="data-table" style={{ minWidth: '1080px' }}>
                <thead>
                  <tr>
                    <th scope="col">Service</th>
                    <th scope="col">Group</th>
                    <th scope="col">Business unit</th>
                    <th scope="col">Type</th>
                    <th scope="col" style={right}>{budget}</th>
                    <th scope="col" style={right}>{current}</th>
                    <th scope="col" style={right}>Change vs {budget}</th>
                    {forward.map((p) => (
                      <th key={p} scope="col" style={right}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.map((l, i) => (
                    <tr key={`${l.service}-${l.bu}-${i}`}>
                      <td className="font-medium" style={{ minWidth: '14rem' }}>{l.service}</td>
                      <td style={{ color: 'var(--ink-2)' }}>{l.group ?? ''}</td>
                      <td style={{ color: 'var(--ink-2)' }}>{l.bu ?? 'Unassigned'}</td>
                      <td style={{ color: 'var(--ink-2)' }}>{l.category ?? ''}</td>
                      <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(l.cost[budget] ?? 0)}</td>
                      <td className="num font-medium" style={right}>{usd(l.cost[current] ?? 0)}</td>
                      <ChangeCell current={l.cost[current] ?? 0} base={l.cost[budget] ?? 0} />
                      {forward.map((p) => (
                        <td key={p} className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(l.cost[p] ?? 0)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
