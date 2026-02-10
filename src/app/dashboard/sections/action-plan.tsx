/**
 * Action Plan Section
 * Strategic recommendations and next steps
 */

export async function ActionPlanSection() {
  const actions = [
    {
      timeline: 'IMMEDIATE',
      title: 'AR Collection Blitz',
      description: 'Escalate EMIRCOM ($3.85M) to CEO level for immediate collection action',
      immediate: true,
    },
    {
      timeline: '0-30 Days',
      title: 'Salesforce UK Contract Review',
      description: 'Urgent review of $4.1M annual contract - identify renegotiation opportunities',
      immediate: false,
    },
    {
      timeline: '30-60 Days',
      title: 'Margin Improvement Program',
      description: 'Launch initiative targeting +3 pts improvement ($441K/qtr)',
      immediate: false,
    },
    {
      timeline: '30-60 Days',
      title: 'Customer Churn Analysis',
      description: 'Root cause analysis of 11.9% ARR decline with retention strategy',
      immediate: false,
    },
    {
      timeline: '60-90 Days',
      title: 'STL Cost Model Replication',
      description: 'Apply STL operational efficiency model to Cloudsense and Kandy',
      immediate: false,
    },
    {
      timeline: '60-90 Days',
      title: 'FY\'26 Reforecast',
      description: 'Update financial projections with stress testing and scenario planning',
      immediate: false,
    },
  ]

  return (
    <section id="action-plan" style={{ display: 'none' }}>
      <h2 style={{
        fontSize: '1.875rem',
        fontWeight: 600,
        color: '#1e3c72',
        marginBottom: '1.25rem',
        paddingBottom: '0.625rem',
        borderBottom: '3px solid #667eea'
      }}>
        Strategic Action Plan
      </h2>

      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        {actions.map((action, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              borderLeft: '5px solid #667eea',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              marginBottom: '1rem'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                paddingTop: '0.375rem',
                paddingBottom: '0.375rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                backgroundColor: action.immediate ? '#f5576c' : '#667eea',
                color: 'white'
              }}
            >
              {action.timeline}
            </span>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#1e3c72',
              marginBottom: '0.5rem'
            }}>
              {action.title}
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#475569'
            }}>
              {action.description}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        backgroundColor: '#e3f2fd',
        borderLeft: '5px solid #4facfe',
        color: '#0d47a1',
        padding: '1.25rem',
        borderRadius: '0.5rem',
        marginTop: '2rem',
        marginBottom: '2rem',
        fontWeight: 500
      }}>
        <strong>SUCCESS METRICS:</strong> Target 5% ARR growth, 3pt margin improvement, and
        reduction of AR &gt;90 days by 50% within 6 months
      </div>
    </section>
  )
}
