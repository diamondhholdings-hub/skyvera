/**
 * Query page loading skeleton
 * Shows pulse-animated placeholders matching NLQ interface layout
 */

export default function QueryLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-4 w-96 bg-slate-200 animate-pulse rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Input and results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search bar skeleton */}
          <div className="h-14 bg-slate-200 animate-pulse rounded-lg" />

          {/* Results area skeleton */}
          <div className="h-96 bg-slate-200 animate-pulse rounded-lg" />
        </div>

        {/* Right column - Canned queries and catalog */}
        <div className="space-y-6">
          {/* Canned queries skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-40 bg-slate-200 animate-pulse rounded" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-lg" />
            ))}
          </div>

          {/* Metrics catalog skeleton */}
          <div className="h-64 bg-slate-200 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  )
}
