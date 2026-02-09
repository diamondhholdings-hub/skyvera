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
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      {/* BU Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Business Unit</label>
        <div className="flex gap-2 flex-wrap">
          {buOptions.map((bu) => (
            <button
              key={bu}
              onClick={() => onBUFilter(bu === 'All' ? null : bu)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (bu === 'All' && activeBU === null) || activeBU === bu
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {bu}
            </button>
          ))}
        </div>
      </div>

      {/* Health Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Health Status</label>
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
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? health === 'Healthy'
                      ? 'bg-green-500 text-white'
                      : health === 'At Risk'
                        ? 'bg-yellow-500 text-white'
                        : health === 'Critical'
                          ? 'bg-red-500 text-white'
                          : 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
