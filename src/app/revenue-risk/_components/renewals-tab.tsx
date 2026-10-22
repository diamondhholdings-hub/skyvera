import { EmptyState } from '@/components/ui/empty-state'
import { type Renewal, isAtRiskRenewal, summarizeRenewals } from '@/lib/data/server/intelligence-data'
import { formatDollars, formatPct } from '../_lib/format'
import { CustomerName, StatusTag, TablePanel, right } from './shared'

export function RenewalsTab({ renewals, currentQuarter }: { renewals: Renewal[]; currentQuarter: string | null }) {
  if (renewals.length === 0) {
    return <EmptyState title="No renewals" description="No subscriptions in the renewal schedule for this business unit." />
  }

  const quarters = summarizeRenewals(renewals)
  const totals = quarters.reduce(
    (t, q) => ({
      subscriptions: t.subscriptions + q.subscriptions,
      arr: t.arr + q.arr,
      renewingArr: t.renewingArr + q.renewingArr,
      atRiskArr: t.atRiskArr + q.atRiskArr,
    }),
    { subscriptions: 0, arr: 0, renewingArr: 0, atRiskArr: 0 }
  )
  const atRisk = renewals.filter(isAtRiskRenewal).sort((a, b) => b.arr - a.arr)

  return (
    <div className="space-y-6">
      <TablePanel
        title="Renewals by quarter"
        description="ARR by renewal quarter. At risk means the subscription is marked No or No (SF) to renew."
      >
        <table className="data-table" style={{ minWidth: '640px' }}>
          <thead>
            <tr>
              <th scope="col">Renewal quarter</th>
              <th scope="col" style={right}>Subscriptions</th>
              <th scope="col" style={right}>ARR</th>
              <th scope="col" style={right}>Renewing</th>
              <th scope="col" style={right}>At risk</th>
              <th scope="col" style={right}>At risk share</th>
            </tr>
          </thead>
          <tbody>
            {quarters.map((q) => (
              <tr key={q.quarter}>
                <th scope="row" className="font-medium" style={{ background: 'transparent', color: 'var(--ink)', fontSize: '0.875rem' }}>
                  <span className="inline-flex items-center gap-2">
                    {q.quarter === 'Next Yr' ? 'Next year' : q.quarter}
                    {q.quarter === currentQuarter && <StatusTag tone="info">Current quarter</StatusTag>}
                  </span>
                </th>
                <td className="num" style={right}>{q.subscriptions}</td>
                <td className="num" style={right}>{formatDollars(q.arr)}</td>
                <td className="num" style={right}>{formatDollars(q.renewingArr)}</td>
                <td className="num" style={{ ...right, color: q.atRiskArr > 0 ? 'var(--critical-ink)' : undefined }}>
                  {formatDollars(q.atRiskArr)}
                </td>
                <td className="num" style={right}>{q.arr > 0 ? formatPct((q.atRiskArr / q.arr) * 100) : '0%'}</td>
              </tr>
            ))}
            <tr style={{ background: 'var(--surface-2)' }}>
              <th scope="row" className="font-semibold" style={{ color: 'var(--ink)', fontSize: '0.875rem' }}>Total</th>
              <td className="num font-semibold" style={right}>{totals.subscriptions}</td>
              <td className="num font-semibold" style={right}>{formatDollars(totals.arr)}</td>
              <td className="num font-semibold" style={right}>{formatDollars(totals.renewingArr)}</td>
              <td className="num font-semibold" style={right}>{formatDollars(totals.atRiskArr)}</td>
              <td className="num font-semibold" style={right}>
                {totals.arr > 0 ? formatPct((totals.atRiskArr / totals.arr) * 100) : '0%'}
              </td>
            </tr>
          </tbody>
        </table>
      </TablePanel>

      <TablePanel
        title="At-risk subscriptions"
        description={`${atRisk.length} subscriptions marked No or No (SF), largest ARR first`}
      >
        {atRisk.length === 0 ? (
          <p className="m-0 px-5 py-4 text-sm" style={{ color: 'var(--muted)' }}>
            No subscriptions are marked as not renewing.
          </p>
        ) : (
          <table className="data-table" style={{ minWidth: '760px' }}>
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Business unit</th>
                <th scope="col">Renewal quarter</th>
                <th scope="col" style={right}>ARR</th>
                <th scope="col">Will renew</th>
                <th scope="col" style={right}>AR over 90 days</th>
              </tr>
            </thead>
            <tbody>
              {atRisk.map((r) => (
                <tr key={r.subscriptionId}>
                  <td>
                    <CustomerName name={r.customer} />
                    {r.endUser && r.endUser !== r.customer && (
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>End user: {r.endUser}</div>
                    )}
                  </td>
                  <td style={{ color: 'var(--ink-2)' }}>{r.bu ?? 'Unassigned'}</td>
                  <td className="num" style={{ color: 'var(--ink-2)' }}>
                    {r.renewalQuarter === 'Next Yr' ? 'Next year' : (r.renewalQuarter ?? 'Unscheduled')}
                  </td>
                  <td className="num font-medium" style={right}>{formatDollars(r.arr)}</td>
                  <td><StatusTag tone="critical">{r.willRenew}</StatusTag></td>
                  <td className="num" style={{ ...right, color: r.arOver90 > 0 ? 'var(--warning-ink)' : 'var(--muted)' }}>
                    {formatDollars(r.arOver90)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TablePanel>
    </div>
  )
}
