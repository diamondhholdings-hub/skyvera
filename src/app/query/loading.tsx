/**
 * Query page loading skeleton
 * Placeholders matching the header, input + answer column, and suggestions column
 */

export default function QueryLoading() {
  return (
    <div>
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1400px] space-y-2 px-4 pb-5 pt-7 lg:px-8">
          <div className="skeleton h-7 w-56" />
          <div className="skeleton h-4 w-96 max-w-full" />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <div className="skeleton h-9" />
          <div className="skeleton h-40" />
        </div>

        <div className="space-y-3">
          <div className="skeleton h-5 w-40" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-8" />
          ))}
          <div className="skeleton mt-4 h-11" />
        </div>
      </div>
    </div>
  )
}
