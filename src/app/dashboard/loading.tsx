/**
 * Dashboard loading skeleton
 * Mirrors the page layout: header with KPI strip, tab row, then section blocks.
 */

export default function DashboardLoading() {
  return (
    <div aria-hidden="true">
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1400px] px-4 pb-5 pt-7 lg:px-8">
          <div className="skeleton h-7 w-64" />
          <div className="skeleton mt-2 h-4 w-80" />
          <div className="skeleton mt-5 h-[78px]" />
        </div>
      </div>
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-[1400px] gap-5 px-4 py-3 lg:px-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-4 w-24" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-20" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton h-56" />
          <div className="skeleton h-56" />
        </div>
      </div>
    </div>
  )
}
