/**
 * Expansion Pipeline Section
 * Upsell and cross-sell opportunities
 */

export async function ExpansionSection() {
  return (
    <section id="expansion" style={{ display: 'none' }}>
      <h2 style={{
        fontSize: '1.8em',
        color: '#1e3c72',
        fontWeight: 'semibold',
        margin: '30px 0 20px 0',
        paddingBottom: '10px',
        borderBottom: '3px solid #667eea'
      }}>
        Expansion Pipeline
      </h2>
      <div style={{ color: '#64748b', textAlign: 'center', padding: '50px 0' }}>
        <p style={{ fontSize: '1.1em' }}>Upsell opportunities, cross-sell analysis, and growth potential</p>
        <p style={{ fontSize: '0.9em', marginTop: '10px' }}>Coming in next implementation phase</p>
      </div>
    </section>
  )
}
