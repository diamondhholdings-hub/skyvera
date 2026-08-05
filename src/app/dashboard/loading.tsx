/**
 * Dashboard loading skeleton
 * Mirrors the in-page DashboardSkeleton in page.tsx so route-level
 * suspense and inner suspense look identical.
 */

export default function DashboardLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-10 py-10">
      <div className="animate-pulse space-y-6">
        <div className="h-64 bg-[var(--border)] rounded-[15px]" />
        <div className="grid grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-[var(--border)] rounded-[15px]" />
          ))}
        </div>
      </div>
    </div>
  )
}
