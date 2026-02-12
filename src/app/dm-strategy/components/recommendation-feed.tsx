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
      <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">
          No recommendations found
        </h3>
        <p className="text-[var(--muted)]">
          All systems are performing well, or try adjusting your filters
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
    critical: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '🚨',
      label: 'CRITICAL',
    },
    high: {
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '⚠️',
      label: 'HIGH',
    },
    medium: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: 'ℹ️',
      label: 'MEDIUM',
    },
    low: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '💡',
      label: 'LOW',
    },
  }

  const typeConfig = {
    retention: { icon: '🛡️', label: 'Retention' },
    expansion: { icon: '📈', label: 'Expansion' },
    pricing: { icon: '💰', label: 'Pricing' },
    product: { icon: '🔧', label: 'Product' },
    engagement: { icon: '🤝', label: 'Engagement' },
    health: { icon: '❤️', label: 'Health' },
  }

  const effortConfig = {
    low: { color: 'text-green-600', label: 'Low Effort' },
    medium: { color: 'text-yellow-600', label: 'Medium Effort' },
    high: { color: 'text-red-600', label: 'High Effort' },
  }

  const priority = priorityConfig[recommendation.priority]
  const type = typeConfig[recommendation.type]
  const effort = effortConfig[recommendation.estimatedEffort]

  return (
    <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${priority.color}`}
              >
                {priority.icon} {priority.label}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {type.icon} {type.label}
              </span>
              <span className="text-xs font-medium text-[var(--muted)]">{recommendation.bu}</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--ink)]">{recommendation.title}</h3>
          </div>
        </div>

        <p className="text-[var(--muted)] leading-relaxed">{recommendation.description}</p>
      </div>

      {/* Body */}
      <div className="p-6 bg-slate-50 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-[var(--secondary)] mb-2">Rationale</h4>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{recommendation.rationale}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[var(--secondary)] mb-2">
            Suggested Action
          </h4>
          <p className="text-sm text-[var(--ink)] leading-relaxed">
            {recommendation.suggestedAction}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[var(--border)] bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-[var(--muted)] mb-1">ARR Impact</div>
            <div className="text-lg font-bold text-[var(--success)]">
              ${(recommendation.estimatedARRImpact / 1e6).toFixed(2)}M
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)] mb-1">DM% Impact</div>
            <div className="text-lg font-bold text-[#00B8D4]">
              +{recommendation.estimatedDMImpact.toFixed(1)}pts
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)] mb-1">Effort</div>
            <div className={`text-sm font-semibold ${effort.color}`}>{effort.label}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)] mb-1">Timeframe</div>
            <div className="text-sm font-semibold text-[var(--ink)]">
              {recommendation.timeframe}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
