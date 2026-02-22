/**
 * CompetitiveTab — Telstra-style rebuild with competitive landscape table,
 * advantage cards, and position banner.
 * Server Component.
 */

import type { Competitor } from '@/lib/types/account-plan'
import { CheckCircle } from 'lucide-react'

interface CompetitiveTabProps {
  competitors: Competitor[]
}

const STATIC_ADVANTAGES = [
  { title: 'Deep Telco Expertise', description: '15+ years of telecom domain knowledge and implementation experience.' },
  { title: '3x Faster Integration', description: 'Proven integration frameworks deliver go-live 3× faster than market average.' },
  { title: '99.9% Uptime SLA', description: 'Enterprise-grade reliability backed by a contractual uptime guarantee.' },
  { title: '94% Customer Retention', description: 'Industry-leading annual renewal rate reflecting consistent value delivery.' },
  { title: '340% ROI Delivered', description: 'Average 3-year ROI across our customer portfolio.' },
  { title: '8-Week Implementation', description: 'Rapid deployment methodology from contract to production go-live.' },
]

export function CompetitiveTab({ competitors }: CompetitiveTabProps) {
  // Derive threat level from competitor type as a proxy (no threatLevel in schema)
  const getThreatLevel = (competitor: Competitor): 'high' | 'medium' | 'low' => {
    if (competitor.type === 'both') return 'high'
    if (competitor.type === 'our-competitor') return 'medium'
    return 'low'
  }

  return (
    <div className="space-y-8">
      {/* Our Advantages */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
          Our Advantages
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {STATIC_ADVANTAGES.map((adv, i) => (
            <div
              key={i}
              className="bg-white rounded-none border border-[var(--border)] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-[var(--success)] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[var(--secondary)] mb-1">{adv.title}</div>
                  <div className="text-sm text-[var(--muted)]">{adv.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Landscape Table */}
      {competitors.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Competitive Landscape
          </h2>
          <div className="bg-white rounded-none border border-[var(--border)] overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Competitor</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Strengths</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Weaknesses</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Threat</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, i) => {
                  const threatLevel = getThreatLevel(comp)
                  return (
                    <tr
                      key={comp.id ?? i}
                      className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                    >
                      <td className="p-4 font-semibold text-[var(--secondary)]">{comp.name}</td>
                      <td className="p-4 text-[var(--muted)] text-sm">
                        {comp.strengths.length > 0 ? comp.strengths.join(', ') : '—'}
                      </td>
                      <td className="p-4 text-[var(--muted)] text-sm">
                        {comp.weaknesses.length > 0 ? comp.weaknesses.join(', ') : '—'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                            threatLevel === 'high'
                              ? 'bg-[var(--critical)]'
                              : threatLevel === 'medium'
                              ? 'bg-[var(--warning)]'
                              : 'bg-[var(--success)]'
                          }`}
                        >
                          {threatLevel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state for competitors */}
      {competitors.length === 0 && (
        <div className="bg-[var(--highlight)] border border-[var(--border)] rounded-none p-12 text-center">
          <p className="text-lg font-medium text-[var(--muted)] mb-1">No competitive intelligence available</p>
          <p className="text-sm text-[var(--muted)]">
            Competitive analysis will appear here as data is gathered.
          </p>
        </div>
      )}
    </div>
  )
}
