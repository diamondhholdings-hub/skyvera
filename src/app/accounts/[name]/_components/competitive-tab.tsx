/**
 * CompetitiveTab - Dual-perspective competitive intelligence
 * Server Component - receives competitors as props
 * Shows: Companies competing with Skyvera + Customer's industry rivals
 * Two-column responsive layout with strengths/weaknesses
 */

import type { Competitor } from '@/lib/types/account-plan'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface CompetitiveTabProps {
  competitors: Competitor[]
}

export function CompetitiveTab({ competitors }: CompetitiveTabProps) {
  // Split competitors by type
  const ourCompetitors = competitors.filter(
    (c) => c.type === 'our-competitor' || c.type === 'both'
  )
  const customerCompetitors = competitors.filter(
    (c) => c.type === 'customer-competitor' || c.type === 'both'
  )

  if (competitors.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <p className="text-lg font-medium text-slate-600 mb-1">No competitive intelligence available</p>
        <p className="text-sm text-slate-500">
          Competitive analysis will appear here as data is gathered
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Our Competitors */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Competing for This Account</h2>
            <Badge variant="danger">{ourCompetitors.length}</Badge>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Companies competing with Skyvera to win or retain this customer
          </p>

          {ourCompetitors.length > 0 ? (
            <div className="space-y-4">
              {ourCompetitors.map((competitor) => (
                <CompetitorCard key={competitor.id} competitor={competitor} />
              ))}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-3xl mb-2">✓</div>
              <p className="text-sm text-green-700 font-medium">No direct competitors identified</p>
            </div>
          )}
        </div>

        {/* Customer's Competitors */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Customer's Market Competitors</h2>
            <Badge variant="default">{customerCompetitors.length}</Badge>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            The customer's industry rivals and competitive landscape
          </p>

          {customerCompetitors.length > 0 ? (
            <div className="space-y-4">
              {customerCompetitors.map((competitor) => (
                <CompetitorCard key={competitor.id} competitor={competitor} />
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
              <p className="text-sm text-slate-600">No customer competitor data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Competitive Summary */}
      <Card title="Competitive Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">{competitors.length}</p>
            <p className="text-sm text-slate-600 mt-1">Total Competitors Tracked</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{ourCompetitors.length}</p>
            <p className="text-sm text-slate-600 mt-1">Competing with Skyvera</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{customerCompetitors.length}</p>
            <p className="text-sm text-slate-600 mt-1">Customer's Market Rivals</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

/**
 * Competitor Card - Shows name, description, strengths/weaknesses, last updated
 */
function CompetitorCard({ competitor }: { competitor: Competitor }) {
  // Format date for display
  const lastUpdated = new Date(competitor.lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-3">
        <h3 className="font-bold text-slate-900 text-lg">{competitor.name}</h3>
        <p className="text-sm text-slate-600 mt-1">{competitor.description}</p>
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* Strengths */}
        <div>
          <h4 className="text-xs font-semibold text-green-700 uppercase mb-2 flex items-center gap-1">
            <span>✓</span> Strengths
          </h4>
          {competitor.strengths.length > 0 ? (
            <ul className="space-y-1">
              {competitor.strengths.map((strength, index) => (
                <li key={index} className="text-xs text-green-700 flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">None identified</p>
          )}
        </div>

        {/* Weaknesses */}
        <div>
          <h4 className="text-xs font-semibold text-red-700 uppercase mb-2 flex items-center gap-1">
            <span>✕</span> Weaknesses
          </h4>
          {competitor.weaknesses.length > 0 ? (
            <ul className="space-y-1">
              {competitor.weaknesses.map((weakness, index) => (
                <li key={index} className="text-xs text-red-700 flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">None identified</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-500 border-t border-slate-100 pt-2">
        Last updated: {lastUpdated}
      </div>
    </div>
  )
}
