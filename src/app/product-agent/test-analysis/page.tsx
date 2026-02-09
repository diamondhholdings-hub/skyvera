'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [results, setResults] = useState<any>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStage('Initializing...');

    // Simulate agent workflow
    const stages = [
      { name: 'Loading customer data...', progress: 10, duration: 500 },
      { name: 'Scanning for patterns...', progress: 25, duration: 1500 },
      { name: 'Analyzing churn risks...', progress: 40, duration: 1200 },
      { name: 'Identifying expansion opportunities...', progress: 55, duration: 1000 },
      { name: 'Cross-referencing competitive intelligence...', progress: 70, duration: 800 },
      { name: 'Generating PRD recommendations...', progress: 85, duration: 1500 },
      { name: 'Complete!', progress: 100, duration: 500 },
    ];

    for (const stage of stages) {
      setCurrentStage(stage.name);
      setProgress(stage.progress);
      await new Promise(resolve => setTimeout(resolve, stage.duration));
    }

    // Mock results
    setResults({
      patterns_detected: 3,
      prds_recommended: 2,
      total_arr_opportunity: 3100000,
      patterns: [
        {
          id: 'pat_001',
          name: 'Enterprise AR Aging + Support Volume Spike',
          confidence: 0.87,
          customers: ['Telstra Corporation Limited', 'British Telecommunications', 'Vodafone Netherlands'],
          arr_at_risk: 1280000,
          signal: '3 enterprise customers with AR >90 days + support ticket volume +150% in last 30 days',
          opportunity: 'Automated billing reminder system with customer self-service portal',
          recommended_prd: true,
          prd_title: 'Automated AR Management & Customer Portal'
        },
        {
          id: 'pat_002',
          name: 'Recurring Revenue Decline Pattern',
          confidence: 0.76,
          customers: ['Multiple customers across Cloudsense'],
          financial_impact: 336000,
          signal: 'RR declining -$336K vs prior plan, multiple customers downgrading',
          opportunity: 'Usage analytics dashboard + proactive engagement alerts',
          recommended_prd: true,
          prd_title: 'Customer Success Early Warning System'
        },
        {
          id: 'pat_003',
          name: 'Multi-BU Customer Consolidation Requests',
          confidence: 0.68,
          customers: ['AT&T Services Inc', 'Telefonica UK Limited'],
          arr_opportunity: 850000,
          signal: '2 customers with multiple BU relationships requesting unified billing & reporting',
          opportunity: 'Multi-BU consolidated view and unified billing',
          recommended_prd: false,
          reason: 'Needs more validation - only 2 customers, confidence below threshold'
        }
      ]
    });

    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/product-agent" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Product Agent
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Test Analysis
          </h1>
          <p className="text-lg text-gray-600">
            Analyze your existing Skyvera customer data to identify product opportunities
          </p>
        </div>

        {/* Analysis Configuration */}
        {!isAnalyzing && !results && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analysis Configuration</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scope
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option>All Business Units (Cloudsense, Kandy, STL)</option>
                  <option>Cloudsense only</option>
                  <option>Kandy only</option>
                  <option>STL only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Area
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option>Churn risk + Expansion opportunities (Recommended)</option>
                  <option>Churn risk only</option>
                  <option>Expansion opportunities only</option>
                  <option>Competitive gaps only</option>
                  <option>All patterns</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Window
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option>Last 90 days (Recommended)</option>
                  <option>Last 30 days</option>
                  <option>Last 180 days</option>
                  <option>All time</option>
                </select>
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="generate-prds" className="mr-2" defaultChecked />
                <label htmlFor="generate-prds" className="text-sm text-gray-700">
                  Generate PRDs for high-confidence patterns (≥85%)
                </label>
              </div>
            </div>

            <button
              onClick={runAnalysis}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              🚀 Run Analysis
            </button>

            <p className="text-sm text-gray-500 mt-4">
              <strong>Note:</strong> This is a test environment. Analysis will scan your real customer data but won't publish PRDs to production.
            </p>
          </div>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analyzing...</h2>
              <p className="text-gray-600">{currentStage}</p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center text-gray-600">{progress}%</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analysis Complete</h2>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{results.patterns_detected}</div>
                  <div className="text-sm text-gray-600">Patterns Detected</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{results.prds_recommended}</div>
                  <div className="text-sm text-gray-600">PRDs Recommended</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    ${(results.total_arr_opportunity / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600">Total ARR Opportunity</div>
                </div>
              </div>
            </div>

            {/* Patterns */}
            {results.patterns.map((pattern: any) => (
              <div key={pattern.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{pattern.name}</h3>
                    <p className="text-gray-600">{pattern.signal}</p>
                  </div>
                  <div className="text-right">
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-2">
                      Confidence: {(pattern.confidence * 100).toFixed(0)}%
                    </div>
                    {pattern.recommended_prd && (
                      <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✓ PRD Recommended
                      </div>
                    )}
                    {!pattern.recommended_prd && (
                      <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                        Below Threshold
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Affected Customers</div>
                    <div className="text-sm text-gray-600">
                      {Array.isArray(pattern.customers) ? pattern.customers.join(', ') : pattern.customers}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Financial Impact</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {pattern.arr_at_risk && `$${(pattern.arr_at_risk / 1000).toFixed(0)}K ARR at risk`}
                      {pattern.financial_impact && `$${(pattern.financial_impact / 1000).toFixed(0)}K impact`}
                      {pattern.arr_opportunity && `$${(pattern.arr_opportunity / 1000).toFixed(0)}K opportunity`}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">Opportunity</div>
                  <div className="text-gray-900">{pattern.opportunity}</div>
                </div>

                {pattern.recommended_prd && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Recommended PRD</div>
                      <div className="text-lg font-semibold text-gray-900">{pattern.prd_title}</div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      Generate PRD
                    </button>
                  </div>
                )}

                {!pattern.recommended_prd && pattern.reason && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <strong>Why not recommended:</strong> {pattern.reason}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Actions */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Next Steps</h3>
              <div className="space-y-2 mb-6">
                <p>✓ {results.patterns_detected} patterns identified in your Skyvera data</p>
                <p>✓ {results.prds_recommended} high-confidence PRDs ready to generate</p>
                <p>✓ ${(results.total_arr_opportunity / 1000000).toFixed(1)}M total ARR opportunity identified</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setResults(null);
                    setProgress(0);
                  }}
                  className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Run Another Analysis
                </button>
                <Link
                  href="/product-agent/backlog"
                  className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors inline-block"
                >
                  View Product Backlog
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
