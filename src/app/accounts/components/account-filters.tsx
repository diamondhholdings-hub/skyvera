'use client'

/**
 * AccountFilters - Segmented filters for BU and health status
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
  const healthOptions = ['All', 'Healthy', 'At risk or critical', 'Critical']

  const healthScoreMap: Record<string, string> = {
    Healthy: 'green',
    'At risk or critical': 'at-risk', // matches both yellow + red (non-healthy)
    Critical: 'red',
  }

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
      <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
        <legend className="section-label mb-1.5 p-0">Business unit</legend>
        <div className="max-w-full overflow-x-auto">
          <div className="segmented">
            {buOptions.map((bu) => (
              <button
                key={bu}
                type="button"
                onClick={() => onBUFilter(bu === 'All' ? null : bu)}
                aria-pressed={(bu === 'All' && activeBU === null) || activeBU === bu}
              >
                {bu}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
        <legend className="section-label mb-1.5 p-0">Health</legend>
        <div className="max-w-full overflow-x-auto">
          <div className="segmented">
            {healthOptions.map((health) => (
              <button
                key={health}
                type="button"
                onClick={() => onHealthFilter(health === 'All' ? null : healthScoreMap[health])}
                aria-pressed={
                  (health === 'All' && activeHealth === null) || activeHealth === healthScoreMap[health]
                }
              >
                {health}
              </button>
            ))}
          </div>
        </div>
      </fieldset>
    </div>
  )
}
