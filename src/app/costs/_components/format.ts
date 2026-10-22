/** Number formatting shared by the cost page sections. */

const MINUS = '−'

/** Whole dollars with separators: $1,733,889 / −$111,709 */
export function usd(value: number): string {
  const rounded = Math.round(value)
  const body = `$${Math.abs(rounded).toLocaleString('en-US')}`
  return rounded < 0 ? `${MINUS}${body}` : body
}

/** Compact dollars for headline figures: $1.73M, $154K */
export function usdCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? MINUS : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1_000)}K`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${Math.round(abs)}`
}

/** Signed dollar change: +$12,345 / −$12,345 */
export function usdSigned(value: number): string {
  const rounded = Math.round(value)
  if (rounded === 0) return '$0'
  return rounded > 0 ? `+${usd(rounded)}` : usd(rounded)
}

/** Percent with one decimal: 36.6% */
export function pct(value: number, digits = 1): string {
  const text = `${Math.abs(value).toFixed(digits)}%`
  return value < 0 ? `${MINUS}${text}` : text
}

/** Signed percent change between two values, or null when there is no base */
export function pctChange(current: number, prior: number): number | null {
  if (!prior) return null
  return ((current - prior) / Math.abs(prior)) * 100
}

/** "+12.3%" / "−27.4%" / "new" */
export function pctChangeLabel(current: number, prior: number): string {
  const change = pctChange(current, prior)
  if (change === null) return current ? 'new' : '0%'
  const text = `${Math.abs(change).toFixed(1)}%`
  if (Math.abs(change) < 0.05) return '0%'
  return change > 0 ? `+${text}` : `${MINUS}${text}`
}
