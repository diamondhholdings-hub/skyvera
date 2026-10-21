'use client'

/**
 * Conversational Scenario Interface
 * Guided, step-by-step interface for what-if scenario modeling
 * Uses CSS design tokens — no generic Tailwind color classes
 */

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { RotateCcw, TrendingUp, GitCompare, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
  const [conversationState, setConversationState] = useState<any>(null)
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
      setConversationState(data.conversationState)
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
        body: JSON.stringify({ message: input, conversationState }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const data = await response.json()

      setConversationState(data.conversationState)
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

  const examples = [
    'What if we raise prices by 15% but lose 10% of customers?',
    'What if we lose our top 3 customers?',
    'What if we acquire a company with $5M ARR and 20 employees?',
    'What if we reduce headcount by 10 people in Cloudsense?',
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conversation panel */}
        <div className={`card flex min-w-0 flex-col ${conversationId ? 'h-[520px] lg:col-span-3 lg:h-[600px]' : 'h-[320px] lg:col-span-2'}`}>
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h2 className="m-0 text-base font-semibold">Scenario</h2>
            {conversationId && (
              <button type="button" onClick={handleReset} className="btn btn-sm">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>New scenario</span>
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 && !conversationId ? (
              <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>
                Describe a scenario below to start. You can refine it with follow-up messages.
              </p>
            ) : (
              <>
                {messages.map((message) => {
                  const isUser = message.role === 'user'
                  return (
                    <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className="min-w-0 max-w-[85%]">
                        <p
                          className={`section-label m-0 mb-1 text-xs ${isUser ? 'text-right' : ''}`}
                        >
                          {isUser ? 'You' : 'Response'}
                        </p>
                        <div
                          className="px-3 py-2 text-sm"
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            background: isUser ? 'var(--surface-2)' : 'var(--surface)',
                            color: 'var(--ink)',
                          }}
                        >
                          <div className="prose prose-sm max-w-none [&_li]:ml-4 [&_p:last-child]:mb-0 [&_p]:mb-2 [&_ul]:mb-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Action Buttons (when applicable) */}
          {currentResponse && (
            <div className="border-t px-4 py-2" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <div className="flex flex-wrap items-center gap-2">
                {currentResponse.type === 'analysis' && versions.length > 0 && (
                  <>
                    <button type="button" onClick={handleRefine} disabled={loading} className="btn btn-sm">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Refine scenario</span>
                    </button>
                    {versions.length >= 2 && (
                      <button type="button" onClick={handleCompare} disabled={loading} className="btn btn-sm">
                        <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          Compare versions (<span className="num">{versions.length}</span>)
                        </span>
                      </button>
                    )}
                  </>
                )}
                {currentResponse.suggestedActions && currentResponse.suggestedActions.length > 0 && (
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    Suggested: {currentResponse.suggestedActions.join(' · ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={conversationId ? 'Add a follow-up or change a parameter' : 'Describe a what-if scenario'}
                aria-label={conversationId ? 'Follow-up message' : 'Describe a scenario'}
                disabled={loading}
                className="input h-9 min-w-0 flex-1 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={conversationId ? handleSendMessage : handleStart}
                disabled={loading || !input.trim()}
                className="btn btn-primary h-9 shrink-0 px-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Working</span>
                  </>
                ) : (
                  <span>{conversationId ? 'Send' : 'Start'}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Example prompts (shown when no conversation) */}
        {!conversationId && (
          <section aria-labelledby="scenario-examples-heading" className="min-w-0">
            <h2 id="scenario-examples-heading" className="m-0 mb-2 text-base font-semibold">
              Examples
            </h2>
            <p className="m-0 mb-2 text-xs" style={{ color: 'var(--muted)' }}>
              Pick one to fill in the scenario, then edit it if you like.
            </p>
            <ul className="m-0 -mx-2 list-none p-0">
              {examples.map((example, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setInput(example)}
                    className="example-row block w-full px-2 py-1.5 text-left text-sm"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Results Display */}
      {currentResponse && currentResponse.type === 'analysis' && currentResponse.data && (
        <ImpactDisplay
          calculatedMetrics={currentResponse.data.calculatedMetrics}
          claudeAnalysis={currentResponse.data.claudeAnalysis}
        />
      )}

      {/* Version History */}
      {versions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
            <h3 className="m-0 text-base font-semibold">Scenario versions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table text-sm">
              <thead>
                <tr>
                  <th scope="col">Version</th>
                  <th scope="col">Impact</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.versionNumber}>
                    <td className="font-medium" style={{ whiteSpace: 'nowrap' }}>
                      {version.label || `Version ${version.versionNumber}`}
                    </td>
                    <td style={{ color: 'var(--ink-2)' }}>{version.impactSummary || ''}</td>
                    <td className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                      {new Date(version.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .example-row {
          border: 0;
          background: transparent;
          color: var(--ink);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 150ms;
        }
        .example-row:hover { background: var(--highlight); }
      `}</style>
    </div>
  )
}
