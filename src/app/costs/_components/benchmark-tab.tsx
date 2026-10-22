/**
 * Cost benchmark: each product's cost as a percent of revenue against the
 * internal cost model ("Standard Benchmark"). This is Skyvera's own model,
 * not a comparison with peer companies.
 */
import { Info } from 'lucide-react'
import type { IntelligenceSnapshot } from '@/lib/data/server/intelligence-data'
import { pct, usdSigned } from './format'
import { CONSOLIDATED, MODEL, sortBUs } from './cost-summary'
import { ModelLegend, Panel, VsModel, right } from './ui'

const SUMMARY_ROWS: Array<{ key: string; label: string; kind: 'margin' | 'cost' | 'target' }> = [
  { key: 'marginTarget', label: 'Margin target', kind: 'target' },
  { key: 'margin', label: 'Net margin', kind: 'margin' },
  { key: 'central', label: 'Central costs', kind: 'cost' },
  { key: 'edge', label: 'Edge (BU-held) costs', kind: 'cost' },
  { key: 'hardCogs', label: 'Hard COGS', kind: 'cost' },
  { key: 'totalCost', label: 'Total cost', kind: 'cost' },
]

/** Within 0.05 points counts as on the model */
const TOLERANCE = 0.05

function CostCell({ value, model }: { value: number; model: number }) {
  const diff = value - model
  if (Math.abs(diff) < TOLERANCE) return <VsModel direction="flat" bad={false} srLabel="">{pct(value)}</VsModel>
  return (
    <VsModel direction={diff > 0 ? 'up' : 'down'} bad={diff > 0} srLabel={diff > 0 ? 'over model' : 'under model'}>
      {pct(value)}
    </VsModel>
  )
}

function MarginCell({ value, target }: { value: number; target: number }) {
  const diff = value - target
  if (Math.abs(diff) < TOLERANCE) return <VsModel direction="flat" bad={false} srLabel="">{pct(value)}</VsModel>
  return (
    <VsModel direction={diff > 0 ? 'up' : 'down'} bad={diff < 0} srLabel={diff < 0 ? 'below target' : 'above target'}>
      {pct(value)}
    </VsModel>
  )
}

export function BenchmarkTab({ intel }: { intel: IntelligenceSnapshot }) {
  const { note, summaryPct, costPct, varianceUsd, rules } = intel.benchmark

  // Products with no margin and no cost this quarter carry no information
  const allProducts = Object.keys(summaryPct.totalCost ?? {}).filter((p) => p !== MODEL)
  const active = allProducts.filter(
    (p) => (summaryPct.margin?.[p] ?? 0) !== 0 || (summaryPct.totalCost?.[p] ?? 0) !== 0
  )
  const hidden = allProducts.filter((p) => !active.includes(p))
  const products = [
    ...active.filter((p) => p === CONSOLIDATED),
    ...sortBUs(active.filter((p) => p !== CONSOLIDATED)),
  ]

  const productHead = (first: string, withModel: boolean) => (
    <thead>
      <tr>
        <th scope="col">{first}</th>
        {withModel && <th scope="col" style={right}>Model</th>}
        {products.map((p) => (
          <th key={p} scope="col" style={right}>{p === CONSOLIDATED ? 'Consolidated' : p}</th>
        ))}
      </tr>
    </thead>
  )
  const minWidth = `${200 + (products.length + 1) * 110}px`
  const varianceRows = Object.entries(varianceUsd).filter(([k]) => k !== 'Total')
  const varianceTotal = varianceUsd.Total
  const actionable = rules.filter((r) => r.action)

  return (
    <div className="space-y-6">
      <div className="alert-box alert-info m-0 flex items-start gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="text-sm">
          <p className="m-0">
            This compares each product with Skyvera&apos;s internal cost model, the &quot;Standard Benchmark&quot; in the
            budget workbook. It is not a comparison with peer companies.
          </p>
          <p className="m-0 mt-1">{note}</p>
        </div>
      </div>

      <ModelLegend />

      <Panel title="Margin and cost mix" description="Percent of revenue, per product, against the model column." flush>
        <div className="relative overflow-x-auto">
          <table className="data-table" style={{ minWidth }}>
            {productHead('Measure', true)}
            <tbody>
              {SUMMARY_ROWS.map((row) => {
                const values = summaryPct[row.key] ?? {}
                return (
                  <tr key={row.key}>
                    <th scope="row">{row.label}</th>
                    <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{pct(values[MODEL] ?? 0)}</td>
                    {products.map((p) => (
                      <td key={p} style={right}>
                        {row.kind === 'target' ? (
                          <span className="num" style={{ color: 'var(--ink-2)' }}>{pct(values[p] ?? 0)}</span>
                        ) : row.kind === 'margin' ? (
                          <MarginCell value={values[p] ?? 0} target={summaryPct.marginTarget?.[p] ?? values[MODEL] ?? 0} />
                        ) : (
                          <CostCell value={values[p] ?? 0} model={values[MODEL] ?? 0} />
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Cost by function" description="Each function's cost as a percent of revenue, against the model." flush>
        <div className="relative overflow-x-auto">
          <table className="data-table" style={{ minWidth }}>
            {productHead('Function', true)}
            <tbody>
              {Object.entries(costPct).map(([fn, values]) => (
                <tr key={fn}>
                  <th scope="row">{fn}</th>
                  <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{pct(values[MODEL] ?? 0)}</td>
                  {products.map((p) => (
                    <td key={p} style={right}>
                      <CostCell value={values[p] ?? 0} model={values[MODEL] ?? 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Dollar variance against the model"
        description="Per quarter. Positive is spend over the model, negative is under it."
        flush
      >
        <div className="relative overflow-x-auto">
          <table className="data-table" style={{ minWidth }}>
            {productHead('Function', false)}
            <tbody>
              {varianceRows.map(([fn, values]) => (
                <tr key={fn}>
                  <th scope="row">{fn}</th>
                  {products.map((p) => (
                    <td key={p} style={right}>
                      <VarianceCell value={values[p] ?? 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {varianceTotal && (
              <tfoot>
                <tr>
                  <th scope="row" style={{ textAlign: 'left' }}>Total</th>
                  {products.map((p) => (
                    <td key={p} style={right}>
                      <VarianceCell value={varianceTotal[p] ?? 0} />
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {hidden.length > 0 && (
          <p className="m-0 px-5 py-3 text-[0.8125rem]" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
            Not shown, no revenue or cost this quarter: {hidden.join(', ')}.
          </p>
        )}
      </Panel>

      {actionable.length > 0 && (
        <Panel title="Model rules" description="What the cost model asks a unit to do when it breaches a line.">
          <ul className="m-0 list-none space-y-4 p-0">
            {actionable.map((r) => (
              <li key={r.rule}>
                <h3 className="m-0 text-sm font-semibold">{r.rule}</h3>
                <ul className="m-0 mt-1 list-disc space-y-0.5 pl-5 text-sm" style={{ color: 'var(--ink-2)' }}>
                  {(r.action ?? '')
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

function VarianceCell({ value }: { value: number }) {
  const rounded = Math.round(value)
  if (rounded === 0) return <span className="num" style={{ color: 'var(--muted)' }}>$0</span>
  return (
    <VsModel direction={rounded > 0 ? 'up' : 'down'} bad={rounded > 0} srLabel={rounded > 0 ? 'over model' : 'under model'}>
      {usdSigned(rounded)}
    </VsModel>
  )
}
