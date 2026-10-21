/**
 * Accounts page loading skeleton
 * Mirrors the page: header with KPI strip, search, filter toolbar, table rows
 */

export default function AccountsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading accounts">
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1400px] px-4 pb-5 pt-7 lg:px-8">
          <div className="skeleton h-7 w-72" />
          <div className="skeleton mt-2 h-4 w-56" />
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--border)' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2 p-4" style={{ background: 'var(--surface)' }}>
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 lg:px-8">
        <div className="skeleton h-9 max-w-md" />
        <div className="flex flex-wrap gap-6">
          <div className="skeleton h-8 w-80" />
          <div className="skeleton h-8 w-72" />
        </div>
        <div className="card overflow-hidden">
          <div className="h-9" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }} />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-3 py-3" style={{ borderTop: i ? '1px solid var(--border)' : undefined }}>
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
