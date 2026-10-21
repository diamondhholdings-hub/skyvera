'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { KpiStrip } from '@/components/ui/kpi-strip';
import { Badge } from '@/components/ui/badge';

export default function TestAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [results, setResults] = useState<any>(null);
  const [generatingPRD, setGeneratingPRD] = useState<string | null>(null);
  const [viewingPRD, setViewingPRD] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  // PRD dialog: focus the dialog on open, trap Tab inside it, close on Escape,
  // and return focus to whatever opened it.
  useEffect(() => {
    if (!viewingPRD) return;
    const dialog = dialogRef.current;
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>('button, [href], select, input, textarea, [tabindex]:not([tabindex="-1"])') ?? []
      ).filter((el) => !el.hasAttribute('disabled'));
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setViewingPRD(null);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      lastTriggerRef.current?.focus();
    };
  }, [viewingPRD]);

  const generatePRD = async (patternId: string) => {
    lastTriggerRef.current = document.activeElement as HTMLElement | null;
    setGeneratingPRD(patternId);
    setGenerationProgress('Initializing PRD generation...');
    const startTime = Date.now();

    const progressMessages = [
      'Analyzing pattern data...',
      'Drafting sections...',
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
      setCurrentStage('Complete');
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

  const formatK = (value: number) => '$' + (value / 1000).toFixed(0) + 'K';

  return (
    <div>
      <PageHeader
        title="Test analysis"
        subtitle="Scan existing Skyvera customer data for product opportunities"
        action={
          <Link href="/product-agent" className="btn">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Product opportunities
          </Link>
        }
      />

      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
        {generationProgress && (
          <div className="alert-box alert-info m-0 flex items-start gap-3" role="status">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold">Generating PRD</p>
              <p className="m-0 mt-0.5 text-sm" style={{ color: 'var(--ink-2)' }}>{generationProgress}</p>
              <p className="m-0 mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>This usually takes 20 to 30 seconds.</p>
            </div>
          </div>
        )}

        {!isAnalyzing && !results && (
          <section className="card max-w-2xl p-5" aria-labelledby="config-heading">
            <h2 id="config-heading" className="m-0 mb-4 text-base font-semibold">Analysis settings</h2>

            <div className="mb-5 space-y-4">
              <div>
                <label htmlFor="ta-scope" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>Scope</label>
                <select id="ta-scope" className="input">
                  <option>All business units (Cloudsense, Kandy, STL)</option>
                  <option>Cloudsense only</option>
                  <option>Kandy only</option>
                  <option>STL only</option>
                </select>
              </div>

              <div>
                <label htmlFor="ta-focus" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>Focus area</label>
                <select id="ta-focus" className="input">
                  <option>Churn risk and expansion opportunities (recommended)</option>
                  <option>Churn risk only</option>
                  <option>Expansion opportunities only</option>
                  <option>Competitive gaps only</option>
                  <option>All patterns</option>
                </select>
              </div>

              <div>
                <label htmlFor="ta-window" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>Time window</label>
                <select id="ta-window" className="input">
                  <option>Last 90 days (recommended)</option>
                  <option>Last 30 days</option>
                  <option>Last 180 days</option>
                  <option>All time</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="generate-prds" defaultChecked style={{ accentColor: 'var(--accent)' }} />
                <label htmlFor="generate-prds" className="text-sm" style={{ color: 'var(--ink)' }}>
                  Generate PRDs for high-confidence patterns (85% and above)
                </label>
              </div>
            </div>

            <button type="button" onClick={runAnalysis} className="btn btn-primary">
              Run analysis
            </button>

            <p className="m-0 mt-4 text-sm" style={{ color: 'var(--muted)' }}>
              This is a test environment. The analysis reads real customer data but does not publish PRDs to production.
            </p>
          </section>
        )}

        {isAnalyzing && (
          <section className="card max-w-2xl p-5" role="status" aria-live="polite">
            <div className="mb-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--muted)' }} aria-hidden="true" />
              <h2 className="m-0 text-base font-semibold">Analyzing</h2>
            </div>
            <p className="m-0 mb-3 text-sm" style={{ color: 'var(--ink-2)' }}>{currentStage}</p>
            <div
              className="h-2 w-full overflow-hidden"
              style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-xs)' }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Analysis progress"
            >
              <div
                className="h-2 transition-all duration-500"
                style={{ width: progress + '%', background: 'var(--secondary)', borderRadius: 'var(--radius-xs)' }}
              ></div>
            </div>
            <p className="num m-0 mt-2 text-right text-xs" style={{ color: 'var(--muted)' }}>{progress}%</p>
          </section>
        )}

        {results && (
          <div className="space-y-6">
            <section aria-labelledby="results-heading" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="results-heading" className="m-0 text-lg font-semibold">Analysis complete</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled
                    title="Coming soon"
                    className="btn"
                  >
                    View product backlog
                  </button>
                  <button
                    type="button"
                    onClick={() => { setResults(null); setProgress(0); }}
                    className="btn"
                  >
                    Run another analysis
                  </button>
                </div>
              </div>
              <KpiStrip
                items={[
                  { label: 'Patterns detected', value: results.patterns_detected },
                  { label: 'PRDs recommended', value: results.prds_recommended },
                  {
                    label: 'Total ARR opportunity',
                    value: '$' + (results.total_arr_opportunity / 1000000).toFixed(1) + 'M',
                  },
                ]}
              />
            </section>

            {results.patterns.map((pattern: any) => (
              <article key={pattern.id} className="card p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 mb-1 text-base font-semibold">{pattern.name}</h3>
                    <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>{pattern.signal}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Badge>
                      Confidence <span className="num">{(pattern.confidence * 100).toFixed(0)}%</span>
                    </Badge>
                    {pattern.recommended_prd ? (
                      <Badge variant="success">PRD recommended</Badge>
                    ) : (
                      <Badge>Below threshold</Badge>
                    )}
                  </div>
                </div>

                <dl className="m-0 mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="section-label mb-0.5">Affected customers</dt>
                    <dd className="m-0 text-sm" style={{ color: 'var(--ink-2)' }}>
                      {Array.isArray(pattern.customers) ? pattern.customers.join(', ') : pattern.customers}
                    </dd>
                  </div>
                  <div>
                    <dt className="section-label mb-0.5">Financial impact</dt>
                    <dd className="num m-0 text-base font-semibold" style={{ color: 'var(--ink)' }}>
                      {pattern.arr_at_risk && formatK(pattern.arr_at_risk) + ' ARR at risk'}
                      {pattern.financial_impact && formatK(pattern.financial_impact) + ' impact'}
                      {pattern.arr_opportunity && formatK(pattern.arr_opportunity) + ' opportunity'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="section-label mb-0.5">Opportunity</dt>
                    <dd className="m-0 text-sm" style={{ color: 'var(--ink)' }}>{pattern.opportunity}</dd>
                  </div>
                </dl>

                {pattern.recommended_prd && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="min-w-0">
                      <div className="section-label">Recommended PRD</div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{pattern.prd_title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => generatePRD(pattern.patternId)}
                      disabled={generatingPRD === pattern.patternId}
                      className="btn"
                    >
                      {generatingPRD === pattern.patternId ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Generating
                        </>
                      ) : 'Generate PRD'}
                    </button>
                  </div>
                )}

                {!pattern.recommended_prd && pattern.reason && (
                  <div className="border-t pt-4 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    <span className="font-medium" style={{ color: 'var(--ink-2)' }}>Why not recommended:</span> {pattern.reason}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {viewingPRD && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'color-mix(in oklch, var(--ink) 40%, transparent)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setViewingPRD(null); }}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="prd-dialog-title"
              className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <h2 id="prd-dialog-title" className="m-0 text-lg font-semibold">{viewingPRD.title}</h2>
                    <Badge>{viewingPRD.prdId}</Badge>
                    <Badge
                      variant={
                        viewingPRD.priorityClass === 'P0' ? 'danger' : viewingPRD.priorityClass === 'P1' ? 'warning' : 'default'
                      }
                    >
                      {viewingPRD.priorityClass}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--muted)' }}>
                    <span>Priority score <span className="num" style={{ color: 'var(--ink)' }}>{viewingPRD.priorityScore}/100</span></span>
                    <span>Confidence <span className="num" style={{ color: 'var(--ink)' }}>{viewingPRD.confidenceScore}%</span></span>
                    <span>Status <span style={{ color: 'var(--ink)' }}>{viewingPRD.status}</span></span>
                    <span>ARR impact <span className="num" style={{ color: 'var(--ink)' }}>{formatK(viewingPRD.arrImpact)}</span></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingPRD(null)}
                  className="btn btn-ghost btn-sm shrink-0"
                  aria-label="Close PRD"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>{viewingPRD.content}</div>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
              >
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  <span className="num">{viewingPRD.customerCount}</span> customers affected · <span className="num">{viewingPRD.implementationWeeks}</span> week implementation
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
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
                    className="btn"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download Markdown
                  </button>
                  <button type="button" onClick={() => setViewingPRD(null)} className="btn btn-primary">
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
