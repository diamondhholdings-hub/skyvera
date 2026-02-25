/**
 * DM% Trends Page (Server Component)
 * Fetches live data from getDMStrategyUIData and passes to client renderer
 */

import { getDMStrategyUIData } from '@/lib/intelligence/dm-strategy/data-provider'
import DMTrendsClient from './trends-client'
import Link from 'next/link'

export default async function DMTrendsPage() {
  const result = await getDMStrategyUIData()

  if (!result.success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', maxWidth: '500px', textAlign: 'center' }}>
          <p style={{ color: 'var(--critical)', fontWeight: 600, marginBottom: '1rem' }}>Unable to load trend data</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{result.error.message}</p>
          <Link href="/dm-strategy" style={{ color: 'var(--secondary)' }}>← Back to DM Strategy</Link>
        </div>
      </div>
    )
  }

  return <DMTrendsClient businessUnits={result.value.businessUnits} />
}
