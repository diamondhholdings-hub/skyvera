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
    const startTime = Date.now();

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
      console.log('[UI] PRD generation completed in ' + elapsed + 's');

      if (!response.ok) {
        throw new Error('Failed to generate PRD: ' + response.statusText);
      }

      const data = await response.json();

      if (data.success) {
        setViewingPRD(data.prd);
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('PRD generation error:', error);
      alert('Error generating PRD: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
        throw new Error('API error: ' + response.statusText);
      }

      const data = await response.json();
      setProgress(100);
      setCurrentStage('Complete!');
      await new Promise(resolve => setTimeout(resolve, 500));
      setResults(data);
    } catch (error) {
      console.error('Analysis error:', error);
      setCurrentStage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] p-8">
      <div className="max-w-6xl mx-auto">

        {generationProgress && (
          <div className="mb-6 bg-gradient-to-r from-[var(--secondary)] to-[#1a2332] text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <div className="flex-1">
              <div className="font-bold text-lg">Generating PRD with Claude Sonnet 4.5</div>
              <div className="text-sm mt-1 opacity-80">{generationProgress}</div>
              <div className="text-xs mt-1 opacity-60">This may take 20-30 seconds...</div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <Link href="/product-agent" className="text-[var(--secondary)] hover:text-[var(--secondary)]/80 mb-4 inline-block">
            Back to Product Agent
          </Link>
          <h1 className="text-4xl font-light font-display text-[var(--secondary)] mb-2">
            Test Analysis
          </h1>
          <p className="text-lg text-[var(--muted)]">
            Analyze your existing Skyvera customer data to identify product opportunities
          </p>
        </div>

        {!isAnalyzing && !results && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-[var(--ink)] mb-4">Analysis Configuration</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Scope</label>
                <select className="w-full border border-[var(--border)] rounded-lg px-4 py-2">
                  <option>All Business Units (Cloudsense, Kandy, STL)</option>
                  <option>Cloudsense only</option>
                  <option>Kandy only</option>
                  <option>STL only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Focus Area</label>
                <select className="w-full border border-[var(--border)] rounded-lg px-4 py-2">
                  <option>Churn risk + Expansion opportunities (Recommended)</option>
                  <option>Churn risk only</option>
                  <option>Expansion opportunities only</option>
                  <option>Competitive gaps only</option>
                  <option>All patterns</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Time Window</label>
                <select className="w-full border border-[var(--border)] rounded-lg px-4 py-2">
                  <option>Last 90 days (Recommended)</option>
                  <option>Last 30 days</option>
                  <option>Last 180 days</option>
                  <option>All time</option>
                </select>
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="generate-prds" className="mr-2" defaultChecked />
                <label htmlFor="generate-prds" className="text-sm text-[var(--ink)]">
                  Generate PRDs for high-confidence patterns (85%+)
                </label>
              </div>
            </div>

            <button
              onClick={runAnalysis}
              className="w-full px-6 py-3 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
            >
              Run Analysis
            </button>

            <p className="text-sm text-[var(--muted)] mt-4">
              <strong>Note:</strong> This is a test environment. Analysis will scan your real customer data but will not publish PRDs to production.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--accent)] mb-4"></div>
              <h2 className="text-2xl font-semibold text-[var(--ink)] mb-2">Analyzing...</h2>
              <p className="text-[var(--muted)]">{currentStage}</p>
            </div>
            <div className="w-full bg-[var(--highlight)] rounded-full h-4 mb-4">
              <div
                className="bg-[var(--accent)] h-4 rounded-full transition-all duration-500"
                style={{ width: progress + '%' }}
              ></div>
            </div>
            <p className="text-center text-[var(--muted)]">{progress}%</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-[var(--ink)] mb-4">Analysis Complete</h2>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-[var(--highlight)] rounded-lg">
                  <div className="text-3xl font-bold text-[var(--secondary)]">{results.patterns_detected}</div>
                  <div className="text-sm text-[var(--muted)]">Patterns Detected</div>
                </div>
                <div className="text-center p-4 bg-[var(--highlight)] rounded-lg">
                  <div className="text-3xl font-bold text-[var(--success)]">{results.prds_recommended}</div>
                  <div className="text-sm text-[var(--muted)]">PRDs Recommended</div>
                </div>
                <div className="text-center p-4 bg-[var(--highlight)] rounded-lg">
                  <div className="text-3xl font-bold text-[var(--accent)]">
                    ${(results.total_arr_opportunity / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-[var(--muted)]">Total ARR Opportunity</div>
                </div>
              </div>
            </div>

            {results.patterns.map((pattern: any) => (
              <div key={pattern.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--ink)] mb-2">{pattern.name}</h3>
                    <p className="text-[var(--muted)]">{pattern.signal}</p>
                  </div>
                  <div className="text-right">
                    <div className="px-3 py-1 bg-[var(--highlight)] text-[var(--secondary)] rounded-full text-sm font-medium mb-2">
                      Confidence: {(pattern.confidence * 100).toFixed(0)}%
                    </div>
                    {pattern.recommended_prd ? (
                      <div className="px-3 py-1 bg-[var(--highlight)] text-[var(--success)] rounded-full text-sm font-medium">
                        PRD Recommended
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-[var(--highlight)] text-[var(--muted)] rounded-full text-sm font-medium">
                        Below Threshold
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-[var(--ink)] mb-1">Affected Customers</div>
                    <div className="text-sm text-[var(--muted)]">
                      {Array.isArray(pattern.customers) ? pattern.customers.join(', ') : pattern.customers}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--ink)] mb-1">Financial Impact</div>
                    <div className="text-lg font-semibold text-[var(--ink)]">
                      {pattern.arr_at_risk && '$' + (pattern.arr_at_risk / 1000).toFixed(0) + 'K ARR at risk'}
                      {pattern.financial_impact && '$' + (pattern.financial_impact / 1000).toFixed(0) + 'K impact'}
                      {pattern.arr_opportunity && '$' + (pattern.arr_opportunity / 1000).toFixed(0) + 'K opportunity'}
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--paper)] rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium text-[var(--ink)] mb-1">Opportunity</div>
                  <div className="text-[var(--ink)]">{pattern.opportunity}</div>
                </div>

                {pattern.recommended_prd && (
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <div>
                      <div className="text-sm font-medium text-[var(--ink)]">Recommended PRD</div>
                      <div className="text-lg font-semibold text-[var(--ink)]">{pattern.prd_title}</div>
                    </div>
                    <button
                      onClick={() => generatePRD(pattern.patternId)}
                      disabled={generatingPRD === pattern.patternId}
                      className="px-4 py-2 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingPRD === pattern.patternId ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Generating...
                        </span>
                      ) : 'Generate PRD'}
                    </button>
                  </div>
                )}

                {!pattern.recommended_prd && pattern.reason && (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <div className="text-sm text-[var(--muted)]">
                      <strong>Why not recommended:</strong> {pattern.reason}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="bg-gradient-to-r from-[var(--secondary)] to-[#1a2332] rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Next Steps</h3>
              <div className="space-y-2 mb-6">
                <p>{results.patterns_detected} patterns identified in your Skyvera data</p>
                <p>{results.prds_recommended} high-confidence PRDs ready to generate</p>
                <p>${(results.total_arr_opportunity / 1000000).toFixed(1)}M total ARR opportunity identified</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => { setResults(null); setProgress(0); }}
                  className="px-6 py-3 bg-white text-[var(--secondary)] font-semibold rounded-lg hover:bg-[var(--highlight)] transition-colors"
                >
                  Run Another Analysis
                </button>
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg opacity-50 cursor-not-allowed"
                >
                  View Product Backlog
                </button>
              </div>
            </div>
          </div>
        )}

        {viewingPRD && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-[var(--ink)]">{viewingPRD.title}</h2>
                    <span className="px-3 py-1 bg-[var(--highlight)] text-[var(--secondary)] rounded-full text-sm font-medium">
                      {viewingPRD.prdId}
                    </span>
                    <span className={'px-3 py-1 rounded-full text-sm font-medium ' + (
                      viewingPRD.priorityClass === 'P0' ? 'bg-[var(--critical)]/10 text-[var(--critical)]' :
                      viewingPRD.priorityClass === 'P1' ? 'bg-[var(--warning)]/10 text-[var(--warning)]' :
                      'bg-[var(--highlight)] text-[var(--muted)]'
                    )}>
                      {viewingPRD.priorityClass}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                    <span>Priority Score: {viewingPRD.priorityScore}/100</span>
                    <span>Confidence: {viewingPRD.confidenceScore}%</span>
                    <span>Status: {viewingPRD.status}</span>
                    <span>ARR Impact: ${(viewingPRD.arrImpact / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <button onClick={() => setViewingPRD(null)} className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <pre className="whitespace-pre-wrap text-sm text-[var(--ink)] font-mono">{viewingPRD.content}</pre>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-[var(--border)] bg-[var(--paper)]">
                <div className="text-sm text-[var(--muted)]">
                  {viewingPRD.customerCount} customers affected &bull; {viewingPRD.implementationWeeks} week implementation
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const blob = new Blob([viewingPRD.content], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = viewingPRD.prdId + '-' + viewingPRD.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.md';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 border border-[var(--border)] text-[var(--ink)] font-medium rounded-lg hover:bg-[var(--highlight)] transition-colors"
                  >
                    Download Markdown
                  </button>
                  <button
                    onClick={() => setViewingPRD(null)}
                    className="px-4 py-2 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
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
