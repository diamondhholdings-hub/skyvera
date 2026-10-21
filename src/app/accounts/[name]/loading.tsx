/**
 * Loading skeleton for account plan page
 * Mirrors the page: back link, title + actions, KPI strip, tab bar, panels
 */

export default function AccountPlanLoading() {
  return (
    <div aria-busy="true" aria-label="Loading account plan">
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1400px] px-4 pb-5 pt-5 lg:px-8">
          <div className="skeleton h-4 w-32" />
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="skeleton h-7 w-72" />
              <div className="skeleton mt-2 h-4 w-56" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-8 w-28" />
              <div className="skeleton h-8 w-28" />
              <div className="skeleton h-8 w-36" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--border)' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2 p-4" style={{ background: 'var(--surface)' }}>
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-6 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex h-10 max-w-[1400px] items-center gap-5 overflow-hidden px-4 lg:px-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-4 w-20 shrink-0" />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
        <div className="card space-y-3 p-5">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    </div>
  )
}
