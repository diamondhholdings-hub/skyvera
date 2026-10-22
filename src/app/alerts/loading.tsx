/**
 * Alerts page loading skeleton
 * Mirrors the page: header with KPI strip, then the alerts table panel
 */

export default function AlertsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading alerts">
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1400px] px-4 pb-5 pt-7 lg:px-8">
          <div className="skeleton mb-2 h-7 w-32" />
          <div className="skeleton h-4 w-80 max-w-full" />
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <div className="card p-5">
          <div className="skeleton mb-4 h-5 w-32" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
