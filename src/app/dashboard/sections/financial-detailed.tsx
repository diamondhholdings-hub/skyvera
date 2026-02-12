/**
 * Financial Detailed Analysis Section
 * Deep dive into cost structure, margin drivers, and DM% tracking
 */

import { DMTracker } from '../components/dm-tracker'

export async function FinancialDetailedSection() {
  return (
    <section id="financial-detailed" style={{ display: 'none' }}>
      <h2 style={{
        fontSize: '1.8em',
        color: '#1e3c72',
        fontWeight: 'semibold',
        margin: '30px 0 20px 0',
        paddingBottom: '10px',
        borderBottom: '3px solid #667eea'
      }}>
        Detailed Financial Analysis
      </h2>

      {/* DM% Tracking & Forecasting */}
      <DMTracker />

      <div style={{ color: '#64748b', textAlign: 'center', padding: '50px 0', marginTop: '40px' }}>
        <p style={{ fontSize: '1.1em' }}>Additional cost structure analysis and margin waterfall coming soon</p>
      </div>
    </section>
  )
}
