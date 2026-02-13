/**
 * DM% Strategy Briefing Section for Executive Dashboard
 * Shows top revenue retention recommendations
 */

import { getDMStrategyUIData } from '@/lib/intelligence/dm-strategy/data-provider'
import DMBriefingWidget from '../components/dm-briefing-widget'

export async function DMBriefingSection() {
  const result = await getDMStrategyUIData()

  // If no data or error, don't show the section
  if (!result.success || result.value.recommendations.length === 0) {
    return null
  }

  const { recommendations } = result.value

  return (
    <div style={{ marginBottom: '40px' }}>
      <DMBriefingWidget recommendations={recommendations} maxItems={5} />
    </div>
  )
}
