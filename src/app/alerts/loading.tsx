/**
 * Alerts page loading skeleton
 * Shows grid of alert card placeholders
 */

export default function AlertsLoading() {
  return (
    <div className="p-6">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-10 w-64 bg-[var(--border)] animate-pulse rounded-lg mb-2" />
        <div className="h-5 w-96 bg-[var(--border)] animate-pulse rounded-lg" />
      </div>

      {/* Alert cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-[var(--border)] animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}
