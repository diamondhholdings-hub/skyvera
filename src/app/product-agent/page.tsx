import Link from 'next/link';

export default function ProductAgentPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Product Agent
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered product intelligence system - Identifying opportunities, generating PRDs, and prioritizing work
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">System Status</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Ready
            </span>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">140</div>
              <div className="text-sm text-gray-600">Customers Loaded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">3</div>
              <div className="text-sm text-gray-600">Business Units</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">$14.7M</div>
              <div className="text-sm text-gray-600">Total ARR</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600">PRDs Generated</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Test Analysis */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Test Analysis</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Analyze your existing customer data to find product opportunities
            </p>
            <Link
              href="/product-agent/test-analysis"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Test Analysis
            </Link>
          </div>

          {/* Submit Feature Request */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Feature Request</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Submit a customer feature request and watch the agent work
            </p>
            <Link
              href="/product-agent/submit-request"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Request
            </Link>
          </div>

          {/* View PRDs */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Product Backlog</h3>
            </div>
            <p className="text-gray-600 mb-4">
              View generated PRDs and manage your product backlog
            </p>
            <Link
              href="/product-agent/backlog"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Backlog
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pattern Detection</h3>
                <p className="text-gray-600">
                  Continuously monitors customer data, feature requests, churn signals, and competitive intelligence to identify product opportunities
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Comprehensive Analysis</h3>
                <p className="text-gray-600">
                  20 specialized AI agents analyze opportunities from multiple perspectives: customer evidence, market research, competitive intelligence, financial modeling, technical feasibility
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">PRD Generation</h3>
                <p className="text-gray-600">
                  Generates comprehensive, outcome-driven PRD documents (14 sections, 3000-5000 words) with customer evidence, ROI models, and strategic alignment in 15-20 minutes
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quality Assurance & Prioritization</h3>
                <p className="text-gray-600">
                  5 QA agents validate every PRD, calculate confidence scores, and apply weighted multi-factor prioritization (ARR impact 40%, customer reach 25%, competitive urgency 20%, implementation feasibility 15%)
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                5
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Multi-Channel Delivery</h3>
                <p className="text-gray-600">
                  PRDs automatically appear in Product Backlog, Account Plans, Alert System, and Executive Dashboard. High-priority items trigger Slack notifications.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                6
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Continuous Learning</h3>
                <p className="text-gray-600">
                  Tracks actual outcomes vs predictions, learns from PM feedback, and continuously improves accuracy (+5% per quarter)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🚀 Ready to Get Started?</h2>
          <p className="text-lg mb-6 opacity-90">
            Click "Run Test Analysis" above to analyze your Skyvera data and generate your first PRD in 15-20 minutes!
          </p>
          <div className="flex gap-4">
            <Link
              href="/product-agent/test-analysis"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Test Analysis
            </Link>
            <Link
              href="/docs/plans/2026-02-09-product-agent-system-design.md"
              className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              View Full Design Doc
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
