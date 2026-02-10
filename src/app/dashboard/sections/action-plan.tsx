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
      <h2 className="text-3xl font-semibold text-[#1e3c72] mb-5 pb-2.5 border-b-[3px] border-[#667eea]">
        Strategic Action Plan
      </h2>

      <div className="space-y-4 my-8">
        {actions.map((action, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl border-l-[5px] border-[#667eea] shadow-sm"
          >
            <span
              className={`inline-block px-4 py-1.5 rounded-2xl text-xs font-semibold mb-3 ${
                action.immediate ? 'bg-[#f5576c] text-white' : 'bg-[#667eea] text-white'
              }`}
            >
              {action.timeline}
            </span>
            <h3 className="text-lg font-bold text-[#1e3c72] mb-2">{action.title}</h3>
            <p className="text-sm text-slate-600">{action.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#e3f2fd] border-l-[5px] border-[#4facfe] text-[#0d47a1] p-5 rounded-lg my-8 font-medium">
        <strong>SUCCESS METRICS:</strong> Target 5% ARR growth, 3pt margin improvement, and
        reduction of AR &gt;90 days by 50% within 6 months
      </div>
    </section>
  )
}
