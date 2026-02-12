'use client'

/**
 * Conversational Scenario Interface
 * AI-powered chat interface for what-if scenario modeling
 */

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Sparkles, RotateCcw, TrendingUp, GitCompare, Loader2 } from 'lucide-react'
import ImpactDisplay from './impact-display'
import type { BaselineMetrics } from '@/lib/data/server/scenario-data'

interface Message {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  messageType: string
  createdAt: Date
}

interface ConversationResponse {
  type: 'clarification' | 'analysis' | 'refinement' | 'comparison' | 'confirmation'
  message: string
  data?: any
  needsUserInput: boolean
  suggestedActions?: string[]
}

interface ConversationalScenarioProps {
  baseline: BaselineMetrics
}

export default function ConversationalScenario({ baseline }: ConversationalScenarioProps) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentResponse, setCurrentResponse] = useState<ConversationResponse | null>(null)
  const [versions, setVersions] = useState<any[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle starting a new conversation
  const handleStart = async () => {
    if (!input.trim()) {
      toast.error('Please describe the scenario you want to explore')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/scenarios/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const data = await response.json()

      setConversationId(data.conversationId)
      setMessages(data.messages)
      setCurrentResponse(data.response)
      setInput('')

      toast.success('Conversation started')
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start conversation')
    } finally {
      setLoading(false)
    }
  }

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/scenarios/conversation/${conversationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const data = await response.json()

      setMessages(data.messages)
      setCurrentResponse(data.response)
      if (data.versions) {
        setVersions(data.versions)
      }
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  // Handle refine scenario
  const handleRefine = async () => {
    if (!conversationId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/scenarios/conversation/${conversationId}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const data = await response.json()
      toast.success('Refinement suggestions generated')

      // Refresh messages
      // In a real implementation, you'd fetch updated messages here
    } catch (error) {
      console.error('Failed to refine scenario:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to refine scenario')
    } finally {
      setLoading(false)
    }
  }

  // Handle compare versions
  const handleCompare = async () => {
    if (!conversationId || versions.length < 2) {
      toast.error('Need at least 2 versions to compare')
      return
    }

    setLoading(true)
    try {
      const versionNumbers = versions.map((v) => v.versionNumber)
      const response = await fetch(`/api/scenarios/conversation/${conversationId}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionNumbers }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const data = await response.json()
      toast.success('Version comparison complete')
    } catch (error) {
      console.error('Failed to compare versions:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to compare versions')
    } finally {
      setLoading(false)
    }
  }

  // Handle reset
  const handleReset = () => {
    setConversationId(null)
    setMessages([])
    setCurrentResponse(null)
    setVersions([])
    setInput('')
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (conversationId) {
        handleSendMessage()
      } else {
        handleStart()
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-display font-semibold text-slate-900">
                Conversational Scenario Planning
              </h2>
            </div>
            <p className="mt-2 text-slate-600">
              Describe what you want to explore in natural language. I'll ask clarifying questions and help you
              refine your scenario.
            </p>
          </div>
          {conversationId && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Scenario</span>
            </button>
          )}
        </div>
      </div>

      {/* Example prompts (shown when no conversation) */}
      {!conversationId && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Try asking:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'What if we raise prices by 15% but lose 10% of customers?',
              'What if we lose our top 3 customers?',
              'What if we acquire a company with $5M ARR and 20 employees?',
              'What if we reduce headcount by 10 people in Cloudsense?',
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => setInput(example)}
                className="text-left p-3 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 hover:border-blue-300 transition-colors text-sm text-slate-700"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col" style={{ height: '600px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !conversationId ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start by describing your scenario below</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-900 border border-slate-200'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2 text-sm font-medium text-slate-600">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Advisor</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Action Buttons (when applicable) */}
        {currentResponse && (
          <div className="border-t border-slate-200 px-6 py-3 bg-slate-50">
            <div className="flex items-center space-x-3">
              {currentResponse.type === 'analysis' && versions.length > 0 && (
                <>
                  <button
                    onClick={handleRefine}
                    disabled={loading}
                    className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 text-sm"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Refine Scenario</span>
                  </button>
                  {versions.length >= 2 && (
                    <button
                      onClick={handleCompare}
                      disabled={loading}
                      className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 text-sm"
                    >
                      <GitCompare className="w-4 h-4" />
                      <span>Compare Versions ({versions.length})</span>
                    </button>
                  )}
                </>
              )}
              {currentResponse.suggestedActions && currentResponse.suggestedActions.length > 0 && (
                <span className="text-xs text-slate-500">
                  Suggested: {currentResponse.suggestedActions.join(' • ')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-end space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                conversationId
                  ? 'Continue the conversation...'
                  : 'Describe your scenario (e.g., "What if we raise prices 10%?")'
              }
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:bg-slate-50"
            />
            <button
              onClick={conversationId ? handleSendMessage : handleStart}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{conversationId ? 'Send' : 'Start'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {currentResponse && currentResponse.type === 'analysis' && currentResponse.data && (
        <div className="mt-6">
          <ImpactDisplay
            calculatedMetrics={currentResponse.data.calculatedMetrics}
            claudeAnalysis={currentResponse.data.claudeAnalysis}
          />
        </div>
      )}

      {/* Version History */}
      {versions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Scenario Versions</h3>
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.versionNumber}
                className="p-4 bg-slate-50 rounded border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">
                      {version.label || `Version ${version.versionNumber}`}
                    </span>
                    {version.impactSummary && (
                      <p className="text-sm text-slate-600 mt-1">{version.impactSummary}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(version.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
