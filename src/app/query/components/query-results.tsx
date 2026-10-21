/**
 * Query Results Component
 * Displays answer, clarification prompt, unavailable notice, or empty state
 */

'use client'

import { AlertTriangle, CheckCircle2, ChevronRight, CircleAlert, HelpCircle, Loader2, XCircle } from 'lucide-react'
import { QueryResult } from '@/lib/intelligence/nlq/types'
import { Badge } from '@/components/ui/badge'

interface QueryResultsProps {
  result: QueryResult | null
  isLoading?: boolean
  onClarificationSelect: (option: string) => void
  onFollowUp: (question: string) => void
}

const rowStyles = `
  .answer-option {
    width: 100%;
    border: 0;
    background: transparent;
    color: var(--ink);
    text-align: left;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background-color 150ms;
  }
  .answer-option:hover { background: var(--highlight); }
`

/**
 * The NLQ engine degrades to a canned "unavailable" answer (or the client
 * records an "Error: ..." answer) instead of failing the request. Detect those
 * so they render as a notice rather than as a real answer.
 */
function getUnavailableReason(answer: string | null | undefined): 'not-configured' | 'unavailable' | 'error' | null {
  if (!answer) return null
  if (answer.startsWith('Error:')) return 'error'
  if (/not configured/i.test(answer)) return 'not-configured'
  if (/temporarily unavailable/i.test(answer)) return 'unavailable'
  return null
}

export function QueryResults({
  result,
  isLoading = false,
  onClarificationSelect,
  onFollowUp,
}: QueryResultsProps) {
  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-6 text-sm"
        style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--muted)' }}
        role="status"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Calculating the answer
      </div>
    )
  }

  // Empty state
  if (!result) {
    return (
      <div
        className="px-5 py-6"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
      >
        <p className="m-0 text-sm font-medium" style={{ color: 'var(--ink)' }}>No question asked yet</p>
        <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Type a question above, or pick one of the suggested questions.
        </p>
      </div>
    )
  }

  const { response } = result
  const unavailable = response.needsClarification ? null : getUnavailableReason(response.answer)

  // Answer could not be produced
  if (unavailable) {
    const message =
      unavailable === 'not-configured'
        ? 'Answers are not set up on this deployment. Add an ANTHROPIC_API_KEY to enable them.'
        : unavailable === 'error'
          ? response.answer!.replace(/^Error:\s*/, '')
          : 'Answers are temporarily unavailable. Try again in a moment.'

    return (
      <div className="alert-box alert-warning m-0 flex items-start gap-3" role="status">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold">Could not answer this question</p>
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>{message}</p>
          <p className="m-0 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
            Question: {result.query}
          </p>
          {unavailable !== 'not-configured' && (
            <button type="button" onClick={() => onFollowUp(result.query)} className="btn btn-sm mt-3">
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  // Clarification needed
  if (response.needsClarification) {
    return (
      <div className="card p-5">
        <style>{rowStyles}</style>
        <div className="flex items-start gap-3">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--warning-ink)' }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-base font-semibold">Which one do you mean?</h3>
            <p className="m-0 mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
              Interpreted as: <span style={{ color: 'var(--ink)' }}>{response.interpretation}</span>
            </p>
            {response.clarificationQuestion && (
              <p className="m-0 mt-2 text-sm font-medium" style={{ color: 'var(--ink)' }}>
                {response.clarificationQuestion}
              </p>
            )}
          </div>
        </div>

        {/* Clarification options */}
        {response.clarificationOptions && response.clarificationOptions.length > 0 && (
          <ul
            className="m-0 mt-4 list-none overflow-hidden p-0"
            style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
          >
            {response.clarificationOptions.map((option, idx) => (
              <li key={idx} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => onClarificationSelect(option)}
                  className="answer-option flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  style={{ borderRadius: 0 }}
                >
                  <span>{option}</span>
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--muted)' }} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // Normal answer display
  return (
    <div className="card">
      <style>{rowStyles}</style>
      {/* Header with confidence badge */}
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
        <h3 className="m-0 text-base font-semibold">Answer</h3>
        <ConfidenceBadge level={response.confidence} />
      </div>

      <div className="flex flex-col gap-5 px-5 py-4">
        {/* Interpretation */}
        <div>
          <p className="section-label m-0 mb-0.5">Interpreted as</p>
          <p className="m-0 text-sm" style={{ color: 'var(--ink-2)' }}>{response.interpretation}</p>
        </div>

        {/* Answer */}
        {response.answer && (
          <p className="m-0 text-base leading-relaxed" style={{ color: 'var(--ink)' }}>{response.answer}</p>
        )}

        {/* Data points */}
        {response.dataPoints && Object.keys(response.dataPoints).length > 0 && (
          <div className="overflow-x-auto" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <table className="data-table text-sm">
              <thead>
                <tr>
                  <th scope="col">Figure</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.dataPoints).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td className="num font-medium" style={{ textAlign: 'right' }}>{formatValue(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sources */}
        {response.sources && response.sources.length > 0 && (
          <div>
            <p className="section-label m-0 mb-1">Sources</p>
            <ul className="m-0 list-disc space-y-0.5 pl-5 text-sm" style={{ color: 'var(--muted)' }}>
              {response.sources.map((source, idx) => (
                <li key={idx}>{source}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested follow-ups */}
        {response.suggestedFollowUps && response.suggestedFollowUps.length > 0 && (
          <div>
            <p className="section-label m-0 mb-1">Related questions</p>
            <ul className="m-0 -mx-2 list-none space-y-0.5 p-0">
              {response.suggestedFollowUps.map((question, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => onFollowUp(question)}
                    className="answer-option block px-2 py-1.5 text-sm"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Confidence badge - color + icon + text
 */
function ConfidenceBadge({ level }: { level: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const config = {
    HIGH: { variant: 'success' as const, Icon: CheckCircle2, label: 'High confidence' },
    MEDIUM: { variant: 'warning' as const, Icon: CircleAlert, label: 'Medium confidence' },
    LOW: { variant: 'danger' as const, Icon: XCircle, label: 'Low confidence' },
  }

  const { variant, Icon, label } = config[level]

  return (
    <Badge variant={variant}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Badge>
  )
}

/**
 * Format data point values with appropriate formatting
 */
function formatValue(value: string | number | (string | number)[]): string {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'number') {
    // Format currency if large number
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }
    // Format percentage if between 0-100
    if (value >= 0 && value <= 100 && value % 1 !== 0) {
      return `${value.toFixed(1)}%`
    }
    return value.toLocaleString()
  }
  return value
}
