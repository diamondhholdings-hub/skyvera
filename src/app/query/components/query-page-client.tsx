/**
 * Query Page Client Wrapper
 * Manages query state and orchestrates all query-related interactions
 */

'use client'

import { useState } from 'react'
import { CannedQuery, QueryFilters, QueryResult } from '@/lib/intelligence/nlq/types'
import { MetricDefinition } from '@/lib/semantic/schema/financial'
import { QueryInput } from './query-input'
import { CannedQueries } from './canned-queries'
import { QueryResults } from './query-results'
import { MetricsCatalog } from './metrics-catalog'
import { RefreshButton } from '@/components/ui/refresh-button'
import { PageHeader } from '@/components/ui/page-header'

// Serializable metric definition without the calculate function
type SerializableMetricDefinition = Omit<MetricDefinition, 'calculate'>

interface QueryPageClientProps {
  cannedQueries: CannedQuery[]
  metrics: Record<string, SerializableMetricDefinition>
}

export function QueryPageClient({ cannedQueries, metrics }: QueryPageClientProps) {
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])

  /**
   * Execute a query against the API
   */
  const executeQuery = async (
    query: string,
    filters?: QueryFilters,
    cannedQueryId?: string,
    contextOverride?: string
  ) => {
    setIsLoading(true)

    try {
      // Build conversation context from history (or use override for clarification chains)
      const conversationContext =
        contextOverride !== undefined
          ? contextOverride
          : conversationHistory.length > 0
            ? `Previous queries in this conversation:\n${conversationHistory.join('\n')}`
            : undefined

      // Call API
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters,
          conversationContext,
          cannedQueryId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Query failed')
      }

      const data = await response.json()

      // Update result
      const result: QueryResult = {
        query: data.query,
        response: data.response,
        timestamp: new Date(data.timestamp),
      }
      setCurrentResult(result)

      // Add to conversation history — record clarification question (not generic "needed")
      const answerForHistory = data.response.needsClarification
        ? `[clarification needed] ${data.response.clarificationQuestion || ''}`
        : (data.response.answer || 'No answer')
      setConversationHistory((prev) => [
        ...prev,
        `Q: ${query}`,
        `A: ${answerForHistory}`,
      ])
    } catch (error) {
      console.error('Query execution error:', error)
      // Show error in result
      setCurrentResult({
        query,
        response: {
          interpretation: query,
          answer: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          needsClarification: false,
          sources: [],
          confidence: 'LOW',
        },
        timestamp: new Date(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle free-form query submission
   */
  const handleFreeFormQuery = (query: string) => {
    executeQuery(query)
  }

  /**
   * Handle canned query selection
   */
  const handleCannedQuery = (query: CannedQuery, filters?: QueryFilters) => {
    // Use the query label as the display query, but send the canned query ID
    executeQuery(query.label, filters, query.id)
  }

  /**
   * Handle clarification option selection
   */
  const handleClarificationSelect = (option: string) => {
    if (!currentResult) return

    // Build full context inline (bypasses async React state) so Claude knows
    // the clarification was already answered and must not ask again
    const enrichedContext = [
      ...conversationHistory,
      `Q: ${currentResult.query}`,
      `AI asked for clarification: ${currentResult.response.clarificationQuestion || ''}`,
      `User answered: ${option}`,
      `IMPORTANT: The user has answered the clarification. Do NOT ask for more clarification. Provide the final answer now.`,
    ].join('\n')

    const refinedQuery = `${currentResult.query} - ${option}`
    executeQuery(refinedQuery, undefined, undefined, enrichedContext)
  }

  /**
   * Handle follow-up question click
   */
  const handleFollowUp = (question: string) => {
    executeQuery(question)
  }

  return (
    <div>
      {/* Editorial Header */}
      <PageHeader
        title="Business Intelligence Query"
        subtitle="Query your business data using natural language"
        action={<RefreshButton label="Refresh Data" />}
      />

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Input and results (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <QueryInput onSubmit={handleFreeFormQuery} isLoading={isLoading} />
            <QueryResults
              result={currentResult}
              onClarificationSelect={handleClarificationSelect}
              onFollowUp={handleFollowUp}
            />
          </div>

          {/* Right column - Canned queries and catalog (1/3 width) */}
          <div className="space-y-6">
            <CannedQueries queries={cannedQueries} onQuerySelect={handleCannedQuery} />
            <MetricsCatalog metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  )
}
