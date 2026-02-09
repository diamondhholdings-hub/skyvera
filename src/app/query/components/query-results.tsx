/**
 * Query Results Component
 * Displays answer, clarification dialog, or empty state
 */

'use client'

import { QueryResult } from '@/lib/intelligence/nlq/types'

interface QueryResultsProps {
  result: QueryResult | null
  onClarificationSelect: (option: string) => void
  onFollowUp: (question: string) => void
}

export function QueryResults({
  result,
  onClarificationSelect,
  onFollowUp,
}: QueryResultsProps) {
  // Empty state
  if (!result) {
    return (
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-12">
        <div className="text-center text-slate-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-lg font-medium mb-1">Ready to answer your questions</p>
          <p className="text-sm">Select a common question or type your own to get started</p>
        </div>
      </div>
    )
  }

  const { response } = result

  // Clarification needed
  if (response.needsClarification) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">Need clarification</h3>
            <p className="text-sm text-amber-800 mb-3">
              I think you&apos;re asking about: <strong>{response.interpretation}</strong>
            </p>
            {response.clarificationQuestion && (
              <p className="text-sm text-amber-900 font-medium mb-3">
                {response.clarificationQuestion}
              </p>
            )}
          </div>
        </div>

        {/* Clarification options */}
        {response.clarificationOptions && response.clarificationOptions.length > 0 && (
          <div className="space-y-2">
            {response.clarificationOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => onClarificationSelect(option)}
                className="w-full text-left px-4 py-3 bg-white border border-amber-300 rounded-lg
                           hover:bg-amber-100 hover:border-amber-400
                           transition-colors
                           text-sm text-slate-900"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Normal answer display
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Header with confidence badge */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Answer</h3>
        <ConfidenceBadge level={response.confidence} />
      </div>

      {/* Answer content */}
      <div className="px-6 py-4 space-y-4">
        {/* Interpretation */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            You asked
          </p>
          <p className="text-sm text-slate-700 italic">{response.interpretation}</p>
        </div>

        {/* Answer */}
        {response.answer && (
          <div>
            <p className="text-base text-slate-900 leading-relaxed">{response.answer}</p>
          </div>
        )}

        {/* Data points */}
        {response.dataPoints && Object.keys(response.dataPoints).length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Key Metrics
            </p>
            <dl className="space-y-2">
              {Object.entries(response.dataPoints).map(([key, value]) => (
                <div key={key} className="flex justify-between items-baseline">
                  <dt className="text-sm text-slate-600">{key}</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {formatValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Sources */}
        {response.sources && response.sources.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Data Sources
            </p>
            <ul className="space-y-1">
              {response.sources.map((source, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {source}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested follow-ups */}
        {response.suggestedFollowUps && response.suggestedFollowUps.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Suggested Follow-ups
            </p>
            <div className="space-y-2">
              {response.suggestedFollowUps.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onFollowUp(question)}
                  className="block w-full text-left px-3 py-2 text-sm text-blue-700
                             bg-blue-50 border border-blue-200 rounded-md
                             hover:bg-blue-100 hover:border-blue-300
                             transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Confidence badge component - WCAG AA compliant with color + icon + text
 */
function ConfidenceBadge({ level }: { level: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const config = {
    HIGH: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      label: 'High Confidence',
    },
    MEDIUM: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Medium Confidence',
    },
    LOW: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Low Confidence',
    },
  }

  const { bg, text, border, icon, label } = config[level]

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${bg} ${text} ${border}`}
      aria-label={label}
    >
      {icon}
      <span className="text-xs font-medium">{level}</span>
    </div>
  )
}

/**
 * Format data point values with appropriate formatting
 */
function formatValue(value: string | number): string {
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
