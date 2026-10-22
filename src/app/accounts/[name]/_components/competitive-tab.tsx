/**
 * CompetitiveTab - threat table, competitive advantages, defensive strategy
 * Server Component
 */

import type { Competitor } from '@/lib/types/account-plan'
import { Badge } from '@/components/ui/badge'

interface CompetitiveTabProps {
  competitors: Competitor[]
}

const STATIC_ADVANTAGES = [
  { label: 'Salesforce-native', value: 'Built on Salesforce', description: 'Seamless with the existing Salesforce ecosystem, deep CRM integration, no middleware.' },
  { label: 'Telecom-specific', value: 'Purpose-built', description: 'Complex telecom bundles handled natively, not generic enterprise CPQ.' },
  { label: 'TM Forum compliant', value: 'Open APIs', description: 'Aligns with autonomous network, composable architecture and open standards.' },
  { label: 'Full quote-to-cash', value: 'CPQ and order management', description: 'End-to-end versus CPQ-only competitors. Fewer integration points.' },
  { label: 'Product roadmap', value: 'Automation', description: 'Guided recommendations, predictive insights and workflow automation.' },
  { label: 'Proven track record', value: '94% retention', description: 'Industry-leading annual renewal rate reflecting consistent value delivery.' },
]

type ThreatVariant = 'danger' | 'warning' | 'default'

export function CompetitiveTab({ competitors }: CompetitiveTabProps) {
  const getThreatVariant = (c: Competitor): ThreatVariant => {
    if (c.threatLevel === 'critical') return 'danger'
    if (c.threatLevel === 'high' || c.type === 'both') return 'warning'
    return 'default'
  }

  const getThreatLabel = (c: Competitor): string => {
    const raw = c.threatLevel ?? (c.type === 'both' ? 'high' : c.type === 'our-competitor' ? 'medium' : 'low')
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
  }

  return (
    <div className="space-y-6">

      {/* Competitive Threats Table */}
      <section className="card overflow-hidden" aria-labelledby="comp-title">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="comp-title" className="m-0">Competitive landscape</h2>
        </div>
        {competitors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th scope="col">Competitor</th>
                  <th scope="col">Threat level</th>
                  <th scope="col">Customer sponsor</th>
                  <th scope="col">Differentiators</th>
                  <th scope="col">Weaknesses</th>
                  <th scope="col">Next action</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, i) => (
                  <tr key={comp.id ?? i} style={{ verticalAlign: 'top' }}>
                    <td className="font-medium">{comp.name}</td>
                    <td><Badge variant={getThreatVariant(comp)}>{getThreatLabel(comp)}</Badge></td>
                    <td className="text-[0.8125rem]">{comp.customerSponsor || '—'}</td>
                    <td className="text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>
                      {comp.strengths.length > 0
                        ? <ul className="m-0 list-disc space-y-0.5 pl-4">{comp.strengths.slice(0, 2).map((s, j) => <li key={j}>{s}</li>)}</ul>
                        : '—'}
                    </td>
                    <td className="text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>
                      {comp.weaknesses.length > 0
                        ? <ul className="m-0 list-disc space-y-0.5 pl-4">{comp.weaknesses.slice(0, 2).map((w, j) => <li key={j}>{w}</li>)}</ul>
                        : '—'}
                    </td>
                    <td className="text-[0.8125rem]" style={{ color: 'var(--ink-2)', maxWidth: '16rem' }}>
                      {comp.nextActionToDefend || <span style={{ color: 'var(--muted)' }}>Monitor</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="m-0 px-5 py-8 text-sm" style={{ color: 'var(--muted)' }}>
            No competitor data for this account yet.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Competitive advantages */}
        <section className="card p-5" aria-labelledby="comp-adv">
          <h2 id="comp-adv" className="m-0">Our competitive advantages</h2>
          <dl className="m-0 mt-3">
            {STATIC_ADVANTAGES.map(({ label, value, description }, i) => (
              <div key={label} className="py-3" style={{ borderTop: i ? '1px solid var(--border)' : undefined }}>
                <dt className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="font-medium">{label}</span>
                  <span style={{ color: 'var(--ink-2)' }}>{value}</span>
                </dt>
                <dd className="m-0 mt-0.5 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Defensive Strategy */}
        <section className="card p-5" aria-labelledby="comp-def">
          <h2 id="comp-def" className="m-0">Defensive strategy and positioning</h2>
          <ol className="m-0 mt-3 list-decimal space-y-2.5 pl-5 text-sm">
            <li className="pl-1"><span className="font-medium">Strengthen platform positioning.</span> Emphasize native integration depth and telecom-specific capabilities that generic competitors cannot match.</li>
            <li className="pl-1"><span className="font-medium">Demonstrate business alignment.</span> Position the platform as the enabler of faster sales, simpler quotes and fewer errors, directly supporting customer cost reduction goals.</li>
            <li className="pl-1"><span className="font-medium">Present the product roadmap.</span> Highlight automation and composable architecture alignment with the customer&apos;s technology direction.</li>
            <li className="pl-1"><span className="font-medium">Expand footprint before review cycles.</span> Drive adoption and usage before any competitive evaluation, creating switching costs beyond technology.</li>
            <li className="pl-1"><span className="font-medium">Build multi-threaded relationships.</span> Executive relationships that survive contact turnover create durable advantage.</li>
          </ol>
        </section>
      </div>

    </div>
  )
}
