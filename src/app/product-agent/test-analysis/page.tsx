'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [results, setResults] = useState<any>(null);
  const [generatingPRD, setGeneratingPRD] = useState<string | null>(null);
  const [viewingPRD, setViewingPRD] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState<string>('');

  const generatePRD = async (patternId: string) => {
    setGeneratingPRD(patternId);
    setGenerationProgress('Initializing PRD generation...');

    // Show immediate feedback
    const startTime = Date.now();
    console.log('[UI] PRD generation started...');

    // Simulate progress updates
    const progressMessages = [
      'Analyzing pattern data...',
      'Consulting Claude Sonnet 4.5...',
      'Generating comprehensive PRD...',
      'Writing Executive Summary...',
      'Defining Success Metrics...',
      'Documenting Technical Approach...',
      'Analyzing Risks...',
      'Finalizing PRD document...',
      'Saving to database...'
    ];

    let messageIndex = 0;
    const progressInterval = setInterval(() => {
      if (messageIndex < progressMessages.length) {
        setGenerationProgress(progressMessages[messageIndex]);
        messageIndex++;
      }
    }, 3000);

    try {
      const response = await fetch('/api/product-agent/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId })
      });

      clearInterval(progressInterval);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[UI] PRD generation completed in ${elapsed}s`);

      if (!response.ok) {
        throw new Error(`Failed to generate PRD: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Show the PRD in a modal
        setViewingPRD(data.prd);
      } else {
        alert(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('PRD generation error:', error);
      alert(`Error generating PRD: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingPRD(null);
      setGenerationProgress('');
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStage('Initializing...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const stages = [
        'Loading customer data...',
        'Scanning for patterns...',
        'Analyzing churn risks...',
        'Identifying expansion opportunities...',
        'Cross-referencing competitive intelligence...',
        'Generating PRD recommendations...'
      ];

      let stageIndex = 0;
      const stageInterval = setInterval(() => {
        if (stageIndex < stages.length) {
          setCurrentStage(stages[stageIndex]);
          stageIndex++;
        }
      }, 800);

      // Call real API
      const response = await fetch('/api/product-agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'business_unit',
          businessUnit: 'all',
          analysisType: 'deep_scan',
          focus: 'churn_risk_and_expansion'
        })
      });

      clearInterval(progressInterval);
      clearInterval(stageInterval);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      setProgress(100);
      setCurrentStage('Complete!');

      await new Promise(resolve => setTimeout(resolve, 500));

      setResults(data);
    } catch (error) {
      console.error('Analysis error:', error);
      setCurrentStage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* PRD Generation Progress Banner */}
        {generationProgress && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <div className="flex-1">
              <div className="font-bold text-lg">🤖 Generating PRD with Claude Sonnet 4.5</div>
              <div className="text-sm text-blue-100 mt-1">{generationProgress}</div>
              <div className="text-xs text-blue-200 mt-1">This may take 20-30 seconds...</div>
            </div>
          </div>
        )}

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
                    <button
                      onClick={() => generatePRD(pattern.patternId)}
                      disabled={generatingPRD === pattern.patternId}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {generatingPRD === pattern.patternId ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Generating...
                        </span>
                      ) : (
                        'Generate PRD'
                      )}
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

        {/* PRD Modal */}
        {viewingPRD && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{viewingPRD.title}</h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {viewingPRD.prdId}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewingPRD.priorityClass === 'P0' ? 'bg-red-100 text-red-800' :
                      viewingPRD.priorityClass === 'P1' ? 'bg-orange-100 text-orange-800' :
                      viewingPRD.priorityClass === 'P2' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingPRD.priorityClass}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Priority Score: {viewingPRD.priorityScore}/100</span>
                    <span>•</span>
                    <span>Confidence: {viewingPRD.confidenceScore}%</span>
                    <span>•</span>
                    <span>Status: {viewingPRD.status}</span>
                    <span>•</span>
                    <span>ARR Impact: ${(viewingPRD.arrImpact / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingPRD(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: markdownToHtml(viewingPRD.content) }} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  {viewingPRD.customerCount} customers affected • {viewingPRD.implementationWeeks} week implementation
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const blob = new Blob([viewingPRD.content], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${viewingPRD.prdId}-${viewingPRD.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Download Markdown
                  </button>
                  <button
                    onClick={() => setViewingPRD(null)}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple markdown to HTML converter (basic version)
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  return html;
}
