/** Compact currency for KPIs: $6.08M, $412K, $950. */
export function formatMoney(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`
  return `${sign}$${Math.round(abs)}`
}

/** Table currency: whole dollars with separators. */
export function formatDollars(value: number): string {
  return `${value < 0 ? '-' : ''}$${Math.round(Math.abs(value)).toLocaleString('en-US')}`
}

export function formatPct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`
}

/** "2026-10-01" -> "Oct 1, 2026"; null -> "Not set". */
export function formatDate(iso: string | null): string {
  if (!iso) return 'Not set'
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** First `max` characters on a word boundary, with an ellipsis when cut. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`
}
