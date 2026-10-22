/**
 * Chart color helpers.
 *
 * Recharts renders SVG, so it can take `var(--x)` strings directly (CHART_VARS).
 * Chart.js draws on canvas and manipulates colors internally, so it needs real
 * rgb strings: readCssColor() resolves a token at runtime (client only).
 */

/** Series order per DESIGN.md: navy first, brick red second, muted third */
export const CHART_VARS = {
  series1: 'var(--secondary)',
  series2: 'var(--accent)',
  series3: 'var(--muted)',
  grid: 'var(--border)',
  axis: 'var(--muted)',
  ink: 'var(--ink)',
  surface: 'var(--surface)',
} as const

/** Shared Recharts tooltip box */
export const TOOLTIP_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  boxShadow: 'var(--shadow-sm)',
  fontSize: '0.8125rem',
  color: 'var(--ink)',
} as const

/**
 * Resolve a CSS custom property (e.g. '--secondary') to an `rgb(...)` string.
 * Paints it onto a 1x1 canvas so OKLCH tokens come back as plain sRGB, which
 * Chart.js's color parser understands.
 */
export function readCssColor(name: string, alpha = 1): string {
  if (typeof window === 'undefined') return 'rgb(0, 0, 0)'
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!raw || !ctx) return 'rgb(0, 0, 0)'
  ctx.fillStyle = raw
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}
