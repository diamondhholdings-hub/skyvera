import type { IntelligenceSnapshot } from '@/lib/data/server/intelligence-data'
import { pct, pctChangeLabel, usd, usdSigned } from './format'
import { Panel, right } from './ui'

/** Metrics stored as a percent already, not dollars */
const PERCENT_METRICS = new Set(['HC + AI Cost on Revenue'])

export function AiTab({ intel }: { intel: IntelligenceSnapshot }) {
  const { current, yearAgo, metrics, vendors } = intel.aiCost
  const vendorRows = vendors
    .map((v) => ({
      vendor: String(v.vendor ?? ''),
      now: Number(v[current] ?? 0),
      then: Number(v[yearAgo] ?? 0),
    }))
    .sort((a, b) => b.now - a.now || b.then - a.then)
  const vendorNow = vendorRows.reduce((s, v) => s + v.now, 0)
  const vendorThen = vendorRows.reduce((s, v) => s + v.then, 0)

  return (
    <div className="space-y-6">
      <Panel
        title="Headcount and AI cost against revenue"
        description={`${current} against ${yearAgo}. Headcount and AI tooling cost as the budget workbook reports them.`}
        flush
      >
        <div className="overflow-x-auto">
          <table className="data-table" style={{ minWidth: '560px' }}>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col" style={right}>{current}</th>
                <th scope="col" style={right}>{yearAgo}</th>
                <th scope="col" style={right}>Change</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics).map(([name, values]) => {
                const now = values[current] ?? 0
                const then = values[yearAgo] ?? 0
                const isPct = PERCENT_METRICS.has(name)
                return (
                  <tr key={name}>
                    <td className={isPct ? 'font-medium' : undefined}>{name}</td>
                    <td className="num font-medium" style={right}>{isPct ? pct(now) : usd(now)}</td>
                    <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{isPct ? pct(then) : usd(then)}</td>
                    <td className="num whitespace-nowrap" style={right}>
                      {isPct ? (
                        `${now - then >= 0 ? '+' : '−'}${Math.abs(now - then).toFixed(1)} pts`
                      ) : (
                        <>
                          {usdSigned(now - then)}
                          <span className="block text-xs" style={{ color: 'var(--muted)' }}>{pctChangeLabel(now, then)}</span>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="AI vendors" description="Where the AI tooling spend is booked." flush>
        <div className="overflow-x-auto">
          <table className="data-table" style={{ minWidth: '520px' }}>
            <thead>
              <tr>
                <th scope="col">Vendor</th>
                <th scope="col" style={right}>{current}</th>
                <th scope="col" style={right}>{yearAgo}</th>
                <th scope="col" style={right}>Change</th>
              </tr>
            </thead>
            <tbody>
              {vendorRows.map((v) => (
                <tr key={v.vendor}>
                  <td className="font-medium">{v.vendor}</td>
                  <td className="num" style={right}>{usd(v.now)}</td>
                  <td className="num" style={{ ...right, color: 'var(--ink-2)' }}>{usd(v.then)}</td>
                  <td className="num" style={right}>{usdSigned(v.now - v.then)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" style={{ textAlign: 'left' }}>Total</th>
                <td className="num" style={right}>{usd(vendorNow)}</td>
                <td className="num" style={right}>{usd(vendorThen)}</td>
                <td className="num" style={right}>{usdSigned(vendorNow - vendorThen)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  )
}
