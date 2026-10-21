/**
 * Recommendation Feed
 * Displays filterable list of DM% recommendations
 */

import type { DMRecommendation } from '@/lib/types/dm-strategy'

interface RecommendationFeedProps {
  recommendations: DMRecommendation[]
}

export function RecommendationFeed({ recommendations }: RecommendationFeedProps) {
  if (recommendations.length === 0) {
    return (
      <div
        className="p-6"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
      >
        <h3 className="m-0 text-sm font-semibold">No recommendations found</h3>
        <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Nothing needs action, or the filters exclude everything.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <RecommendationCard key={rec.id} recommendation={rec} />
      ))}
    </div>
  )
}

function RecommendationCard({ recommendation }: { recommendation: DMRecommendation }) {
  const priorityConfig = {
    critical: { className: 'badge-critical', label: 'Critical' },
    high: { className: 'badge-warning', label: 'High' },
    medium: { className: 'badge-info', label: 'Medium' },
    low: { className: 'badge-info', label: 'Low' },
  }

  const typeLabel = {
    retention: 'Retention',
    expansion: 'Expansion',
    pricing: 'Pricing',
    product: 'Product',
    engagement: 'Engagement',
    health: 'Health',
  }

  const effortLabel = {
    low: 'Low effort',
    medium: 'Medium effort',
    high: 'High effort',
  }

  const priority = priorityConfig[recommendation.priority]

  return (
    <article className="card">
      {/* Header */}
      <div className="border-b p-5" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={`px-1.5 py-0.5 font-medium ${priority.className}`} style={{ borderRadius: 'var(--radius-xs)' }}>
            {priority.label}
          </span>
          <span style={{ color: 'var(--ink-2)' }}>{typeLabel[recommendation.type]}</span>
          <span style={{ color: 'var(--muted)' }}>{recommendation.bu}</span>
        </div>
        <h3 className="m-0 text-base font-semibold">{recommendation.title}</h3>
        <p className="m-0 mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>{recommendation.description}</p>
      </div>

      {/* Body */}
      <div className="space-y-3 p-5">
        <div>
          <h4 className="m-0 mb-1 text-sm font-semibold">Rationale</h4>
          <p className="m-0 text-sm" style={{ color: 'var(--ink-2)' }}>{recommendation.rationale}</p>
        </div>
        <div>
          <h4 className="m-0 mb-1 text-sm font-semibold">Suggested action</h4>
          <p className="m-0 text-sm" style={{ color: 'var(--ink)' }}>{recommendation.suggestedAction}</p>
        </div>
      </div>

      {/* Footer */}
      <dl className="m-0 grid grid-cols-2 gap-4 border-t p-5 md:grid-cols-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <dt className="text-xs" style={{ color: 'var(--muted)' }}>ARR impact</dt>
          <dd className="num m-0 text-sm font-semibold">${(recommendation.estimatedARRImpact / 1e6).toFixed(2)}M</dd>
        </div>
        <div>
          <dt className="text-xs" style={{ color: 'var(--muted)' }}>DM% impact</dt>
          <dd className="num m-0 text-sm font-semibold">+{recommendation.estimatedDMImpact.toFixed(1)} pts</dd>
        </div>
        <div>
          <dt className="text-xs" style={{ color: 'var(--muted)' }}>Effort</dt>
          <dd className="m-0 text-sm font-medium">{effortLabel[recommendation.estimatedEffort]}</dd>
        </div>
        <div>
          <dt className="text-xs" style={{ color: 'var(--muted)' }}>Timeframe</dt>
          <dd className="m-0 text-sm font-medium">{recommendation.timeframe}</dd>
        </div>
      </dl>
    </article>
  )
}
