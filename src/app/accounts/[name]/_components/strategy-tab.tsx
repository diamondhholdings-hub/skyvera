/**
 * StrategyTab — Telstra-style rebuild with pain-point table, opportunity table,
 * and hover cards for strategic objectives.
 * Server Component.
 */

import type { PainPoint, Opportunity } from '@/lib/types/account-plan'

interface StrategyTabProps {
  painPoints: PainPoint[]
  opportunities: Opportunity[]
}

export function StrategyTab({ painPoints, opportunities }: StrategyTabProps) {
  return (
    <div className="space-y-8">
      {/* Pain Points Table */}
      {painPoints.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold mb-4 pb-2 border-b-[2px] border-[var(--border)]" style={{ color: 'var(--secondary)' }}>
            Pain Points
          </h2>
          <div style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Pain Point</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Description</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Status</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody>
                {painPoints.map((pp, i) => (
                  <tr
                    key={pp.id ?? i}
                    className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                  >
                    <td className="p-4 text-[var(--ink)] font-medium">{pp.title}</td>
                    <td className="p-4 text-[var(--muted)] text-sm leading-relaxed">{pp.description}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide ${
                          pp.status === 'active'
                            ? 'bg-[var(--critical)] text-white'
                            : pp.status === 'monitoring'
                            ? 'bg-[var(--warning)] text-white'
                            : 'bg-[var(--success)] text-white'
                        }`}
                      >
                        {pp.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide ${
                          pp.severity === 'high'
                            ? 'bg-[var(--critical)] text-white'
                            : pp.severity === 'medium'
                            ? 'bg-[var(--warning)] text-white'
                            : 'bg-[var(--success)] text-white'
                        }`}
                      >
                        {pp.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opportunities Table */}
      {opportunities.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold mb-4 pb-2 border-b-[2px] border-[var(--border)]" style={{ color: 'var(--secondary)' }}>
            Growth Opportunities
          </h2>
          <div style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Opportunity</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Description</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Value</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Probability</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp, i) => (
                  <tr
                    key={opp.id ?? i}
                    className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                  >
                    <td className="p-4 text-[var(--ink)] font-medium">{opp.title}</td>
                    <td className="p-4 text-[var(--muted)] text-sm leading-relaxed">{opp.description}</td>
                    <td className="p-4 text-[var(--ink)]">
                      {opp.estimatedValue
                        ? `$${(opp.estimatedValue / 1e3).toFixed(0)}K`
                        : '—'}
                    </td>
                    <td className="p-4">
                      {opp.probability != null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent)] rounded-full"
                              style={{ width: `${opp.probability}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--muted)] w-8">{opp.probability}%</span>
                        </div>
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {painPoints.length === 0 && opportunities.length === 0 && (
        <div className="rounded-none p-12 text-center" style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <p className="text-lg font-medium text-[var(--muted)] mb-1">No strategy data available</p>
          <p className="text-sm text-[var(--muted)]">
            Pain points and opportunities will appear here as they are identified.
          </p>
        </div>
      )}
    </div>
  )
}
