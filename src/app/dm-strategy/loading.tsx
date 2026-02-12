/**
 * Loading state for DM Strategy page
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-r from-[#0066A1] to-[#0080C8] animate-pulse">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="h-10 bg-white/20 rounded w-1/2 mb-3" />
          <div className="h-6 bg-white/20 rounded w-3/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-6 h-32" />
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Skeleton */}
          <aside className="lg:col-span-1">
            <div className="bg-slate-200 rounded-lg h-96" />
          </aside>

          {/* Main Content Skeleton */}
          <main className="lg:col-span-3">
            <div className="mb-6 flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-24 bg-slate-200 rounded-lg" />
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-200 rounded-lg h-64" />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
