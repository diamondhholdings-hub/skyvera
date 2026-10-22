/**
 * Financial Detailed Analysis Section
 * Deep dive into cost structure, margin drivers, and DM% tracking
 */

import { DMTracker } from '../components/dm-tracker'

export async function FinancialDetailedSection() {
  return (
    <section id="financial-detailed" style={{ display: 'none' }}>
      {/* DM% Tracking & Forecasting (carries the section heading) */}
      <DMTracker />

      <p className="m-0 mt-8 text-sm" style={{ color: 'var(--muted)' }}>
        Cost structure analysis and a margin waterfall are planned for a later release.
      </p>
    </section>
  )
}
