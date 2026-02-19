/**
 * Accounts page loading skeleton
 * Shows search bar and table rows placeholders
 */

export default function AccountsLoading() {
  return (
    <div className="p-6">
      {/* Header skeleton */}
      <div className="h-10 w-64 bg-[var(--border)] animate-pulse rounded-lg mb-6" />

      {/* Search bar skeleton */}
      <div className="h-10 w-full bg-[var(--border)] animate-pulse rounded-lg mb-4" />

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] overflow-hidden">
        {/* Table header */}
        <div className="bg-[var(--highlight)] border-b border-[var(--border)] h-12" />

        {/* Table rows */}
        <div className="divide-y divide-[var(--border)]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 px-6 flex items-center space-x-4">
              <div className="h-4 bg-[var(--border)] animate-pulse rounded flex-1" />
              <div className="h-4 bg-[var(--border)] animate-pulse rounded w-24" />
              <div className="h-4 bg-[var(--border)] animate-pulse rounded w-24" />
              <div className="h-4 bg-[var(--border)] animate-pulse rounded w-32" />
              <div className="h-4 bg-[var(--border)] animate-pulse rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
