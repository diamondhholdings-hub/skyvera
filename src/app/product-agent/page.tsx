import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiStrip } from '@/components/ui/kpi-strip';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    name: 'Pattern detection',
    description:
      'Monitors customer data, feature requests, churn signals and competitive information to find product opportunities.',
  },
  {
    name: 'Analysis',
    description:
      'Reviews each opportunity from several angles: customer evidence, market research, competitive position, financial model and technical feasibility.',
  },
  {
    name: 'PRD drafting',
    description:
      'Drafts an outcome-focused PRD (14 sections, 3,000 to 5,000 words) with customer evidence, an ROI model and strategic fit.',
  },
  {
    name: 'Review and prioritization',
    description:
      'Checks every PRD, scores confidence, and ranks it by weighted factors: ARR impact 40%, customer reach 25%, competitive urgency 20%, implementation feasibility 15%.',
  },
  {
    name: 'Delivery',
    description:
      'Publishes PRDs to the product backlog, account plans, alerts and the overview dashboard. High-priority items also post to Slack.',
  },
  {
    name: 'Feedback',
    description: 'Compares actual outcomes with predictions and PM feedback to improve future scoring.',
  },
];

export default function ProductAgentPage() {
  return (
    <div>
      <PageHeader
        title="Product opportunities"
        subtitle="Find product opportunities in customer data, draft PRDs and prioritize the backlog"
        action={
          <Link href="/docs/plans/2026-02-09-product-agent-system-design.md" className="btn">
            Design doc
          </Link>
        }
      >
        <KpiStrip
          items={[
            { label: 'Customers loaded', value: '140' },
            { label: 'Business units', value: '3' },
            { label: 'Total ARR', value: '$14.7M' },
            { label: 'PRDs generated', value: '0' },
          ]}
        />
      </PageHeader>

      <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-6 lg:px-8">
        {/* Actions */}
        <section className="card overflow-hidden" aria-labelledby="pa-actions-heading">
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 id="pa-actions-heading" className="m-0 text-base font-semibold">
              Actions
            </h2>
            <Badge variant="success">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Ready
            </Badge>
          </div>
          <ul className="m-0 list-none p-0">
            <li className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
              <div className="min-w-0">
                <h3 className="m-0 text-sm font-semibold">Test analysis</h3>
                <p className="m-0 mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
                  Scan existing customer data for product opportunities.
                </p>
              </div>
              <Link href="/product-agent/test-analysis" className="btn btn-primary">
                Run test analysis
              </Link>
            </li>
            {/* Submit Feature Request - disabled (page not yet built) */}
            <li className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
              <div className="min-w-0">
                <h3 className="m-0 text-sm font-semibold">Feature request</h3>
                <p className="m-0 mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
                  Submit a customer feature request for analysis.
                </p>
              </div>
              <button type="button" disabled title="Coming soon" className="btn">
                Coming soon
              </button>
            </li>
            {/* View PRDs - disabled (page not yet built) */}
            <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <h3 className="m-0 text-sm font-semibold">Product backlog</h3>
                <p className="m-0 mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
                  View generated PRDs and manage the product backlog.
                </p>
              </div>
              <button type="button" disabled title="Coming soon" className="btn">
                Coming soon
              </button>
            </li>
          </ul>
        </section>

        {/* How It Works */}
        <section aria-labelledby="pa-how-heading">
          <h2 id="pa-how-heading" className="m-0 mb-3 text-lg font-semibold">
            How it works
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th scope="col">Step</th>
                    <th scope="col">What happens</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step) => (
                    <tr key={step.name}>
                      <td className="font-medium" style={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        {step.name}
                      </td>
                      <td style={{ color: 'var(--ink-2)' }}>{step.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
