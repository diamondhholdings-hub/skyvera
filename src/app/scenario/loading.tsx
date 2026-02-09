/**
 * Scenario modeling loading skeleton
 * Shows pulse-animated placeholders for scenario type selector, form, and impact area
 */

export default function ScenarioLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-4 w-96 bg-slate-200 animate-pulse rounded-lg" />
      </div>

      {/* Scenario type selector skeleton */}
      <div className="flex space-x-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 w-32 bg-slate-200 animate-pulse rounded-lg" />
        ))}
      </div>

      {/* Form skeleton */}
      <div className="space-y-4 max-w-2xl">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-lg" />
        ))}
      </div>

      {/* Submit button skeleton */}
      <div className="h-12 w-40 bg-slate-200 animate-pulse rounded-lg" />

      {/* Impact area skeleton */}
      <div className="h-96 bg-slate-200 animate-pulse rounded-lg" />
    </div>
  )
}
