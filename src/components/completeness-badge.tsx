/**
 * CompletenessBadge — data completeness score (0-100) as a small tag.
 * Server-compatible: no 'use client' directive required.
 */

interface CompletenessBadgeProps {
  score: number
}

function badgeClass(score: number): string {
  if (score <= 33) return 'badge-critical'
  if (score <= 66) return 'badge-warning'
  if (score <= 99) return 'badge-info'
  return 'badge-success'
}

export function CompletenessBadge({ score }: CompletenessBadgeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))

  return (
    <span
      className={`num inline-flex shrink-0 items-center whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ${badgeClass(clamped)}`}
      style={{ borderRadius: 'var(--radius-xs)' }}
      title={`Data completeness: ${clamped}%`}
    >
      {clamped}% complete
    </span>
  )
}
