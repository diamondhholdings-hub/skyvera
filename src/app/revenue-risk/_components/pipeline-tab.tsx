import { EmptyState } from '@/components/ui/empty-state'
import { type PipelineOpportunity, groupSum } from '@/lib/data/server/intelligence-data'
import { formatDate, formatDollars, formatPct } from '../_lib/format'
import { CLOSED_LOST } from '../_lib/view-model'
import { CustomerName, StatusTag, TablePanel, right } from './shared'

function StageTag({ stage }: { stage: string | null }) {
  if (!stage) return <span style={{ color: 'var(--muted)' }}>No stage</span>
  if (stage === CLOSED_LOST) return <StatusTag tone="critical">{stage}</StatusTag>
  return <StatusTag tone="neutral">{stage}</StatusTag>
}

export function PipelineTab({ pipeline }: { pipeline: PipelineOpportunity[] }) {
  if (pipeline.length === 0) {
    return <EmptyState title="No renewal opportunities" description="No Salesforce renewal opportunities for this business unit." />
  }

  const byStage = groupSum(pipeline, (p) => p.stage, (p) => p.arr)
  const currentByStage = new Map(groupSum(pipeline, (p) => p.stage, (p) => p.currentArr).map((s) => [s.name, s.total]))
  const opportunities = [...pipeline].sort((a, b) => b.arr - a.arr)

  return (
    <div className="space-y-6">
      <TablePanel title="By stage" description="Salesforce renewal opportunities grouped by stage, largest renewal ARR first">
        <table className="data-table" style={{ minWidth: '520px' }}>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col" style={right}>Opportunities</th>
              <th scope="col" style={right}>Current ARR</th>
              <th scope="col" style={right}>Renewal ARR</th>
            </tr>
          </thead>
          <tbody>
            {byStage.map((s) => (
              <tr key={s.name}>
                <td><StageTag stage={s.name} /></td>
                <td className="num" style={right}>{s.count}</td>
                <td className="num" style={right}>{formatDollars(currentByStage.get(s.name) ?? 0)}</td>
                <td className="num font-medium" style={right}>{formatDollars(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <TablePanel title="Opportunities" description={`${opportunities.length} opportunities, largest renewal ARR first`}>
        <table className="data-table" style={{ minWidth: '1040px' }}>
          <thead>
            <tr>
              <th scope="col">Account</th>
              <th scope="col">Business unit</th>
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
            {opportunities.map((p) => (
              <tr key={p.opportunityId}>
                <td>
                  <CustomerName name={p.account} />
                  {p.opportunity && (
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{p.opportunity}</div>
                  )}
                </td>
                <td style={{ color: 'var(--ink-2)' }}>{p.bu ?? 'Unassigned'}</td>
                <td><StageTag stage={p.stage} /></td>
                <td className="num whitespace-nowrap" style={{ color: 'var(--ink-2)' }}>{formatDate(p.renewalDate)}</td>
                <td className="num whitespace-nowrap" style={{ color: 'var(--ink-2)' }}>{formatDate(p.closeDate)}</td>
                <td style={{ color: 'var(--ink-2)' }}>{p.owner ?? 'Unassigned'}</td>
                <td className="num" style={right}>{formatPct(p.probabilityPct)}</td>
                <td className="num" style={right}>{formatDollars(p.currentArr)}</td>
                <td className="num font-medium" style={right}>{formatDollars(p.arr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </div>
  )
}
