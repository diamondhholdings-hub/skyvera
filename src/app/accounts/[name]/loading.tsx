/**
 * Loading skeleton for account plan page
 * Shows animated placeholder matching page layout
 */

export default function AccountPlanLoading() {
  return (
    <div className="p-6 animate-pulse">
      {/* Back link */}
      <div className="h-5 w-32 bg-slate-200 rounded mb-4"></div>

      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-64 bg-slate-300 rounded mb-2"></div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-24 bg-slate-200 rounded"></div>
          <div className="h-6 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex space-x-8">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-10 w-20 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-lg"></div>
      </div>
    </div>
  )
}
