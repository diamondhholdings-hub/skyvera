import { EmptyState } from '@/components/ui/empty-state'
import { type Receivable, groupSum } from '@/lib/data/server/intelligence-data'
import { formatDollars, formatPct, truncate } from '../_lib/format'
import { sum } from '../_lib/view-model'
import { CustomerName, StatusTag, TablePanel, right } from './shared'

function CollectionNote({ note, buComments }: { note: string | null; buComments: string | null }) {
  if (!note && !buComments) return <span style={{ color: 'var(--muted)' }}>No note</span>
  const preview = truncate(note ?? buComments ?? '', 80)
  return (
    <details className="rr-note">
      <summary className="text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>{preview}</summary>
      <div className="mt-2 space-y-2 text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>
        {note && <p className="m-0 whitespace-pre-line">{note}</p>}
        {buComments && (
          <p className="m-0">
            <span className="section-label">BU comment: </span>
            {buComments}
          </p>
        )}
      </div>
    </details>
  )
}

export function ReceivablesTab({ receivables }: { receivables: Receivable[] }) {
  if (receivables.length === 0) {
    return <EmptyState title="No receivables over 90 days" description="No customer in this business unit has a balance over 90 days." />
  }

  const total = sum(receivables, (r) => r.arOver90)
  const byBU = groupSum(receivables, (r) => r.bu, (r) => r.arOver90)
  const arrByBU = new Map(groupSum(receivables, (r) => r.bu, (r) => r.arrInBudget).map((g) => [g.name, g.total]))
  const customers = [...receivables].sort((a, b) => b.arOver90 - a.arOver90)

  return (
    <div className="space-y-6">
      <TablePanel
        title="By business unit"
        description="Balances over 90 days from AR Aging. The workbook has no finer aging buckets."
      >
        <table className="data-table" style={{ minWidth: '600px' }}>
          <thead>
            <tr>
              <th scope="col">Business unit</th>
              <th scope="col" style={right}>Customers</th>
              <th scope="col" style={right}>AR over 90 days</th>
              <th scope="col" style={right}>Share of total</th>
              <th scope="col" style={right}>ARR in budget</th>
            </tr>
          </thead>
          <tbody>
            {byBU.map((g) => (
              <tr key={g.name}>
                <td className="font-medium">{g.name}</td>
                <td className="num" style={right}>{g.count}</td>
                <td className="num font-medium" style={right}>{formatDollars(g.total)}</td>
                <td className="num" style={right}>{total > 0 ? formatPct((g.total / total) * 100, 1) : '0%'}</td>
                <td className="num" style={right}>{formatDollars(arrByBU.get(g.name) ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <TablePanel title="Customers" description={`${customers.length} customers, largest balance first`}>
        <table className="data-table" style={{ minWidth: '1000px' }}>
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col">Business unit</th>
              <th scope="col" style={right}>AR over 90 days</th>
              <th scope="col" style={right}>ARR in budget</th>
              <th scope="col">Over 10% of ARR</th>
              <th scope="col">Revenue in budget</th>
              <th scope="col" style={{ minWidth: '18rem' }}>Latest collection note</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((r) => (
              <tr key={`${r.customer}-${r.bu ?? ''}`} style={{ verticalAlign: 'top' }}>
                <td><CustomerName name={r.customer} /></td>
                <td style={{ color: 'var(--ink-2)' }}>{r.bu ?? 'Unassigned'}</td>
                <td className="num font-medium" style={right}>{formatDollars(r.arOver90)}</td>
                <td className="num" style={right}>{formatDollars(r.arrInBudget)}</td>
                <td>
                  {r.arOver10PctOfArr
                    ? <StatusTag tone="warning">Yes</StatusTag>
                    : <span style={{ color: 'var(--muted)' }}>No</span>}
                </td>
                <td>
                  {r.revenueInBudget
                    ? <StatusTag tone="success">Included</StatusTag>
                    : <StatusTag tone="critical">Excluded</StatusTag>}
                </td>
                <td><CollectionNote note={r.latestNote} buComments={r.buComments} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </div>
  )
}
