import Link from 'next/link';

export default function ProductAgentPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light font-display text-[var(--secondary)] mb-2">
            Product Agent
          </h1>
          <p className="text-lg text-[var(--muted)]">
            AI-powered product intelligence system - Identifying opportunities, generating PRDs, and prioritizing work
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-[var(--ink)]">System Status</h2>
            <span className="px-3 py-1 bg-[var(--highlight)] text-[var(--ink)] rounded-full text-sm font-medium">
              ✓ Ready
            </span>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--secondary)]">140</div>
              <div className="text-sm text-[var(--muted)]">Customers Loaded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--success)]">3</div>
              <div className="text-sm text-[var(--muted)]">Business Units</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--accent)]">$14.7M</div>
              <div className="text-sm text-[var(--muted)]">Total ARR</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--warning)]">0</div>
              <div className="text-sm text-[var(--muted)]">PRDs Generated</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Test Analysis */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[var(--highlight)] rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Test Analysis</h3>
            </div>
            <p className="text-[var(--muted)] mb-4">
              Analyze your existing customer data to find product opportunities
            </p>
            <Link
              href="/product-agent/test-analysis"
              className="inline-block px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
            >
              Run Test Analysis
            </Link>
          </div>

          {/* Submit Feature Request - disabled (page not yet built) */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[var(--highlight)] rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Feature Request</h3>
            </div>
            <p className="text-[var(--muted)] mb-4">
              Submit a customer feature request and watch the agent work
            </p>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="inline-block px-4 py-2 bg-[var(--highlight)] text-[var(--muted)] rounded-lg opacity-50 cursor-not-allowed"
            >
              Submit Request
            </button>
          </div>

          {/* View PRDs - disabled (page not yet built) */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[var(--highlight)] rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Product Backlog</h3>
            </div>
            <p className="text-[var(--muted)] mb-4">
              View generated PRDs and manage your product backlog
            </p>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="inline-block px-4 py-2 bg-[var(--highlight)] text-[var(--muted)] rounded-lg opacity-50 cursor-not-allowed"
            >
              View Backlog
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-[var(--ink)] mb-4">How It Works</h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--secondary)] text-white rounded-full flex items-center justify-center font-bold mr-4">
                1
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-1">Pattern Detection</h3>
                <p className="text-[var(--muted)]">
                  Continuously monitors customer data, feature requests, churn signals, and competitive intelligence to identify product opportunities
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--secondary)] text-white rounded-full flex items-center justify-center font-bold mr-4">
                2
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-1">Comprehensive Analysis</h3>
                <p className="text-[var(--muted)]">
                  20 specialized AI agents analyze opportunities from multiple perspectives: customer evidence, market research, competitive intelligence, financial modeling, technical feasibility
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--secondary)] text-white rounded-full flex items-center justify-center font-bold mr-4">
                3
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-1">PRD Generation</h3>
                <p className="text-[var(--muted)]">
                  Generates comprehensive, outcome-driven PRD documents (14 sections, 3000-5000 words) with customer evidence, ROI models, and strategic alignment in 15-20 minutes
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--secondary)] text-white rounded-full flex items-center justify-center font-bold mr-4">
                4
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-1">Quality Assurance &amp; Prioritization</h3>
                <p className="text-[var(--muted)]">
                  5 QA agents validate every PRD, calculate confidence scores, and apply weighted multi-factor prioritization (ARR impact 40%, customer reach 25%, competitive urgency 20%, implementation feasibility 15%)
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--secondary)] text-white rounded-full flex items-center justify-center font-bold mr-4">
                5
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-1">Multi-Channel Delivery</h3>
                <p className="text-[var(--muted)]">
                  PRDs automatically appear in Product Backlog, Account Plans, Alert System, and Executive Dashboard. High-priority items trigger Slack notifications.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-[var(--secondary)] text-white rounded-full flex items-center justify-center font-bold mr-4">
                6
              </div>
              <div>
                <h3 className="font-semibold text-[var(--ink)] mb-1">Continuous Learning</h3>
                <p className="text-[var(--muted)]">
                  Tracks actual outcomes vs predictions, learns from PM feedback, and continuously improves accuracy (+5% per quarter)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 bg-gradient-to-r from-[var(--secondary)] to-[#1a2332] rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-6 opacity-90">
            Click &quot;Run Test Analysis&quot; above to analyze your Skyvera data and generate your first PRD in 15-20 minutes!
          </p>
          <div className="flex gap-4">
            <Link
              href="/product-agent/test-analysis"
              className="px-6 py-3 bg-white text-[var(--secondary)] font-semibold rounded-lg hover:bg-[var(--highlight)] transition-colors"
            >
              Start Test Analysis
            </Link>
            <Link
              href="/docs/plans/2026-02-09-product-agent-system-design.md"
              className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[var(--secondary)] transition-colors"
            >
              View Full Design Doc
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
