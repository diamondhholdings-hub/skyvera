/**
 * Scenario modeling loading skeleton
 * Placeholders for the mode control, example prompts, and the conversation panel
 */

/** Content-area placeholder; also the Suspense fallback inside page.tsx */
export function ScenarioLoadingBody() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="skeleton h-[480px] lg:col-span-2" />
        <div className="space-y-2">
          <div className="skeleton h-5 w-32" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-8" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ScenarioLoading() {
  return (
    <div>
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1400px] space-y-2 px-4 pb-5 pt-7 lg:px-8">
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-4 w-[32rem] max-w-full" />
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <ScenarioLoadingBody />
      </div>
    </div>
  )
}
