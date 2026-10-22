/**
 * Action Plan Section
 * Strategic recommendations and next steps
 */

import { Badge } from '@/components/ui/badge'
import { AlertBox } from '../components/alert-box'
import { Panel, SectionHeading } from '../components/panel'

export async function ActionPlanSection() {
  const actions = [
    {
      timeline: 'Immediate',
      title: 'AR collection blitz',
      description: 'Escalate EMIRCOM ($3.85M) to CEO level for immediate collection action',
      immediate: true,
    },
    {
      timeline: '0-30 days',
      title: 'Salesforce UK contract review',
      description: 'Urgent review of $4.1M annual contract to identify renegotiation opportunities',
      immediate: false,
    },
    {
      timeline: '30-60 days',
      title: 'Margin improvement program',
      description: 'Launch initiative targeting +3 pts improvement ($441K/qtr)',
      immediate: false,
    },
    {
      timeline: '30-60 days',
      title: 'Customer churn analysis',
      description: 'Root cause analysis of 11.9% ARR decline with retention strategy',
      immediate: false,
    },
    {
      timeline: '60-90 days',
      title: 'STL cost model replication',
      description: 'Apply STL operational efficiency model to Cloudsense and Kandy',
      immediate: false,
    },
    {
      timeline: '60-90 days',
      title: 'FY\'26 reforecast',
      description: 'Update financial projections with stress testing and scenario planning',
      immediate: false,
    },
  ]

  return (
    <section id="action-plan" style={{ display: 'none' }}>
      <SectionHeading title="Action plan" />

      <Panel title="Next steps" description="Ordered by timeline" flush>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '8rem' }}>Timeline</th>
                <th>Action</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action, index) => (
                <tr key={index}>
                  <td>
                    <Badge variant={action.immediate ? 'danger' : 'default'}>{action.timeline}</Badge>
                  </td>
                  <td className="font-medium" style={{ whiteSpace: 'nowrap' }}>{action.title}</td>
                  <td style={{ color: 'var(--ink-2)' }}>{action.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <AlertBox variant="info">
        <strong>Success metrics:</strong> 5% ARR growth, 3 pt margin improvement, and AR &gt; 90 days
        reduced by 50% within 6 months.
      </AlertBox>
    </section>
  )
}
