/**
 * Loading state for the revenue retention page
 * Mirrors the layout: header with KPI strip, BU table, recommendations + sidebar
 */

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading revenue retention">
      {/* Header + KPI strip */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1400px] px-4 pb-5 pt-7 lg:px-8">
          <div className="skeleton mb-2 h-7 w-56" />
          <div className="skeleton h-4 w-[28rem] max-w-full" />
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-20" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
        {/* BU table */}
        <div className="card p-5">
          <div className="skeleton mb-4 h-5 w-40" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-8 w-full" />
            ))}
          </div>
        </div>

        {/* Recommendations + sidebar */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <div className="skeleton h-8 w-80 max-w-full" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-48" />
            ))}
          </div>
          <div className="skeleton h-96" />
        </div>
      </div>
    </div>
  )
}
