/**
 * KpiStrip — a single bordered row of headline figures, divided by hairlines.
 * Replaces the old tile grids: one container, no per-metric cards, no
 * gradients. Tone colors the figure only, and is always backed by the
 * `context` text so color is never the only signal.
 */

import React from 'react'

export type KpiTone = 'default' | 'success' | 'warning' | 'critical'

export interface KpiItem {
  label: string
  value: React.ReactNode
  /** Secondary line: comparison, target, or source */
  context?: React.ReactNode
  tone?: KpiTone
}

const toneColor: Record<KpiTone, string> = {
  default: 'var(--ink)',
  success: 'var(--success-ink)',
  warning: 'var(--warning-ink)',
  critical: 'var(--critical-ink)',
}

export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <dl
      className="grid overflow-hidden"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 10.5rem), 1fr))`,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        gap: '1px',
        background: 'var(--border)',
        margin: 0,
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ background: 'var(--surface)', padding: '0.875rem 1rem' }}>
          <dt style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--muted)' }}>{item.label}</dt>
          <dd
            className="num"
            style={{
              margin: '0.25rem 0 0',
              fontSize: '1.375rem',
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
              color: toneColor[item.tone ?? 'default'],
            }}
          >
            {item.value}
          </dd>
          {item.context && (
            <dd style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>{item.context}</dd>
          )}
        </div>
      ))}
    </dl>
  )
}
