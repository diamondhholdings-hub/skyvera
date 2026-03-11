/**
 * CompletenessBadge — displays a data completeness score (0-100) as a colored pill badge.
 * Server-compatible: no 'use client' directive required.
 */

interface CompletenessBadgeProps {
  score: number
}

function getBadgeColor(score: number): string {
  if (score <= 33) return 'var(--critical, #e53935)'
  if (score <= 66) return '#ff9800'
  if (score <= 99) return '#2196f3'
  return 'var(--success, #4caf50)'
}

export function CompletenessBadge({ score }: CompletenessBadgeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const color = getBadgeColor(clamped)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: color,
        color: '#fff',
        borderRadius: '2px',
        fontSize: '0.65rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '2px 6px',
        fontFamily: 'var(--font-body)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
      title={`Data completeness: ${clamped}%`}
    >
      {clamped}% complete
    </span>
  )
}
