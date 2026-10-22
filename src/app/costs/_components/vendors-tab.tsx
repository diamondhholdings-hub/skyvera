import Link from 'next/link'
import { Info } from 'lucide-react'
import { groupSum, type IntelligenceSnapshot } from '@/lib/data/server/intelligence-data'
import { EmptyState } from '@/components/ui/empty-state'
import { pct, pctChangeLabel, usd, usdSigned } from './format'
import { BUFilter, Panel, ShareBar, buildHref, right } from './ui'

const LARGE_VENDOR = 50_000

export function VendorsTab({
  intel,
  bus,
  bu,
}: {
  intel: IntelligenceSnapshot
  bus: string[]
  bu: string | null
}) {
  const { quarters, priorQuarter } = intel.vendors
  const quarter = quarters[0]
  const forward = quarters.slice(1)
  const allLines = intel.vendors.lines
  const vendorBUs = bus.filter((b) => allLines.some((l) => l.bu === b))
  const lines = (bu ? allLines.filter((l) => l.bu === bu) : allLines)
    .slice()
    .sort((a, b) => (b.byQuarter[quarter] ?? 0) - (a.byQuarter[quarter] ?? 0))

  const now = (l: (typeof allLines)[number]) => l.byQuarter[quarter] ?? 0
  const total = lines.reduce((s, l) => s + now(l), 0)
  const priorTotal = lines.reduce((s, l) => s + l.priorQuarterForecast, 0)
  const allTotal = allLines.reduce((s, l) => s + now(l), 0)

  const byBU = groupSum(allLines, (l) => l.bu, now)
  const byNature = groupSum(lines, (l) => l.nature, now)
  const byCategory = groupSum(lines, (l) => l.category, now)
  const top = lines[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <BUFilter tab="vendors" bus={vendorBUs} active={bu} />
        <p className="m-0 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
          <span className="num">{lines.length}</span> vendors · {bu ?? 'all business units'} · {quarter} budget
          vs {priorQuarter} forecast
        </p>
      </div>

      {top && (
        <div className="alert-box alert-info m-0 flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="m-0 text-sm">
            Largest vendor: <strong>{top.vendor}</strong> ({top.bu ?? 'unassigned'}) at{' '}
            <span className="num">{usd(now(top))}</span> this quarter,{' '}
            <span className="num">{pct(total ? (now(top) / total) * 100 : 0, 0)}</span> of{' '}
            {bu ? `${bu} ` : ''}vendor spend.
            {top.comments && <> {top.comments}</>}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="By business unit"
          description={`${quarter} vendor spend, all units. Select a unit to filter.`}
          flush
        >
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '420px' }}>
              <thead>
                <tr>
                  <th scope="col">Business unit</th>
                  <th scope="col" style={right}>Vendors</th>
                  <th scope="col" style={right}>{quarter}</th>
                  <th scope="col" style={right}>Share</th>
                </tr>
              </thead>
              <tbody>
                {byBU.map((g) => (
                  <tr key={g.name} style={g.name === bu ? { background: 'var(--highlight)' } : undefined}>
                    <td>
                      <Link
                        href={buildHref('vendors', g.name === bu ? null : g.name)}
                        scroll={false}
                        prefetch={false}
                        aria-current={g.name === bu ? 'page' : undefined}
                        style={{ color: 'var(--secondary)' }}
                      >
                        {g.name}
                      </Link>
                    </td>
                    <td className="num" style={right}>{g.count}</td>
                    <td className="num" style={right}>{usd(g.total)}</td>
                    <td style={right}>
                      <span className="inline-flex items-center gap-2">
                        <ShareBar share={allTotal ? (g.total / allTotal) * 100 : 0} />
                        <span className="num">{pct(allTotal ? (g.total / allTotal) * 100 : 0)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="By expense nature"
          description={`${quarter} vendor spend${bu ? `, ${bu}` : ''}. COGS vs operating expense: ${byCategory
            .map((c) => `${c.name} ${usd(c.total)}`)
            .join(', ')}.`}
          flush
        >
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '420px' }}>
              <thead>
                <tr>
                  <th scope="col">Nature</th>
                  <th scope="col" style={right}>Vendors</th>
                  <th scope="col" style={right}>{quarter}</th>
                  <th scope="col" style={right}>Share</th>
                </tr>
              </thead>
              <tbody>
                {byNature.map((g) => (
                  <tr key={g.name}>
                    <td>{g.name}</td>
                    <td className="num" style={right}>{g.count}</td>
                    <td className="num" style={right}>{usd(g.total)}</td>
                    <td style={right}>
                      <span className="inline-flex items-center gap-2">
                        <ShareBar share={total ? (g.total / total) * 100 : 0} />
                        <span className="num">{pct(total ? (g.total / total) * 100 : 0)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel
        title="Vendors"
        description={`Sorted by ${quarter} spend. Vendors over ${usd(LARGE_VENDOR)} a quarter are flagged. Open a note to read the budget comment.`}
        flush
      >
        {lines.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No vendors for this unit" description="Choose another business unit or show all units." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '1180px' }}>
              <thead>
                <tr>
                  <th scope="col">Vendor</th>
                  <th scope="col">Business unit</th>
                  <th scope="col">Category</th>
                  <th scope="col">Nature</th>
                  <th scope="col" style={right}>{quarter}</th>
                  <th scope="col" style={right}>{priorQuarter} forecast</th>
                  <th scope="col" style={right}>Change</th>
                  {forward.map((q) => (
                    <th key={q} scope="col" style={right}>{q}</th>
                  ))}
                  <th scope="col" style={right}>4 quarter total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const current = now(l)
                  const large = current > LARGE_VENDOR
                  return (
                    <tr key={`${l.vendor}-${l.bu}-${i}`}>
                      <td style={{ minWidth: '16rem', maxWidth: '24rem' }}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{l.vendor}</span>
                          {large && (
                            <span className="badge-warning rounded-[var(--radius-xs)] px-1.5 py-0.5 text-xs font-medium">
                              Over $50K
                            </span>
                          )}
                        </div>
                        {l.comments && (
                          <details className="mt-1 text-[0.8125rem]">
                            <summary className="cursor-pointer" style={{ color: 'var(--secondary)' }}>
                              Note
                            </summary>
                            <p className="m-0 mt-1 whitespace-pre-line" style={{ color: 'var(--ink-2)' }}>
                              {l.comments}
                            </p>
                          </details>
                        )}
                      </td>
                      <td style={{ color: 'var(--ink-2)' }}>{l.bu ?? 'Unassigned'}</td>
                      <td style={{ color: 'var(--ink-2)' }}>{l.category ?? ''}</td>
                      <td style={{ color: 'var(--ink-2)' }}>{l.nature ?? ''}</td>
                      <td className="num font-medium" style={right}>{usd(current)}</td>
                      <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(l.priorQuarterForecast)}</td>
                      <td className="num whitespace-nowrap" style={right}>
                        {usdSigned(current - l.priorQuarterForecast)}
                        <span className="block text-xs" style={{ color: 'var(--muted)' }}>
                          {pctChangeLabel(current, l.priorQuarterForecast)}
                        </span>
                      </td>
                      {forward.map((q) => (
                        <td key={q} className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(l.byQuarter[q] ?? 0)}</td>
                      ))}
                      <td className="num" style={right}>{usd(l.fourQuarterTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={4} style={{ textAlign: 'left' }}>Total</th>
                  <td className="num font-semibold" style={right}>{usd(total)}</td>
                  <td className="num" style={right}>{usd(priorTotal)}</td>
                  <td className="num whitespace-nowrap" style={right}>
                    {usdSigned(total - priorTotal)}
                    <span className="block text-xs" style={{ color: 'var(--muted)' }}>
                      {pctChangeLabel(total, priorTotal)}
                    </span>
                  </td>
                  {forward.map((q) => (
                    <td key={q} className="num" style={right}>
                      {usd(lines.reduce((s, l) => s + (l.byQuarter[q] ?? 0), 0))}
                    </td>
                  ))}
                  <td className="num font-semibold" style={right}>
                    {usd(lines.reduce((s, l) => s + l.fourQuarterTotal, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
