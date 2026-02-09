/**
 * Dashboard loading skeleton
 * Shows pulse-animated placeholders matching actual dashboard layout
 */

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-lg" />

      {/* KPI cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-80 bg-slate-200 animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
