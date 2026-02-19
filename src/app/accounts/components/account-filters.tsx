'use client'

/**
 * AccountFilters - Filter buttons for BU and health status
 * Client Component - uses callbacks to update table filters
 */

interface AccountFiltersProps {
  onBUFilter: (bu: string | null) => void
  onHealthFilter: (health: string | null) => void
  activeBU: string | null
  activeHealth: string | null
}

export function AccountFilters({
  onBUFilter,
  onHealthFilter,
  activeBU,
  activeHealth,
}: AccountFiltersProps) {
  const buOptions = ['All', 'Cloudsense', 'Kandy', 'STL', 'NewNet']
  const healthOptions = ['All', 'Healthy', 'At Risk', 'Critical']

  const healthScoreMap: Record<string, string> = {
    Healthy: 'green',
    'At Risk': 'yellow',
    Critical: 'red',
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* BU Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink">Business Unit</label>
        <div className="flex gap-2 flex-wrap">
          {buOptions.map((bu) => (
            <button
              key={bu}
              onClick={() => onBUFilter(bu === 'All' ? null : bu)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border button-press ${
                (bu === 'All' && activeBU === null) || activeBU === bu
                  ? 'bg-accent text-white border-accent'
                  : 'bg-highlight text-ink border-[var(--border)] hover:border-accent'
              }`}
            >
              {bu}
            </button>
          ))}
        </div>
      </div>

      {/* Health Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink">Health Status</label>
        <div className="flex gap-2 flex-wrap">
          {healthOptions.map((health) => {
            const isActive =
              (health === 'All' && activeHealth === null) ||
              activeHealth === healthScoreMap[health]

            return (
              <button
                key={health}
                onClick={() =>
                  onHealthFilter(health === 'All' ? null : healthScoreMap[health])
                }
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border button-press ${
                  isActive
                    ? health === 'Healthy'
                      ? 'bg-[var(--success)] text-white border-[var(--success)]'
                      : health === 'At Risk'
                        ? 'bg-[var(--warning)] text-white border-[var(--warning)]'
                        : health === 'Critical'
                          ? 'bg-[var(--critical)] text-white border-[var(--critical)]'
                          : 'bg-accent text-white border-accent'
                    : 'bg-highlight text-ink border-[var(--border)] hover:border-accent'
                }`}
              >
                {health}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
