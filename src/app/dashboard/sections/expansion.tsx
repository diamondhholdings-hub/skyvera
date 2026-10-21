/**
 * Expansion Pipeline Section
 * Upsell and cross-sell opportunities
 */

import { TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeading } from '../components/panel'

export async function ExpansionSection() {
  return (
    <section id="expansion" style={{ display: 'none' }}>
      <SectionHeading title="Expansion pipeline" />
      <EmptyState
        icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
        title="Not built yet"
        description="Upsell opportunities, cross-sell analysis and growth potential are planned for the next implementation phase."
      />
    </section>
  )
}
