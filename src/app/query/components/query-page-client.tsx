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
    cannedQueryId?: string
  ) => {
    setIsLoading(true)

    try {
      // Build conversation context from history
      const conversationContext =
        conversationHistory.length > 0
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

      // Add to conversation history
      setConversationHistory((prev) => [
        ...prev,
        `Q: ${query}`,
        `A: ${data.response.answer || 'Clarification needed'}`,
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

    // Append clarification to original query
    const refinedQuery = `${currentResult.query} - ${option}`
    executeQuery(refinedQuery)
  }

  /**
   * Handle follow-up question click
   */
  const handleFollowUp = (question: string) => {
    executeQuery(question)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Ask a Question</h1>
          <p className="text-slate-600">
            Query your business data using natural language
          </p>
        </div>
        <RefreshButton label="Refresh Data" />
      </div>

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
  )
}
