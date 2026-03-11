'use client'

/**
 * AccountChatPanel — floating per-account AI chat widget
 * Anchored bottom-right of viewport; collapsed = round button, expanded = full panel
 * Uses streaming fetch to /api/accounts/[name]/chat
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AccountChatPanelProps {
  customerName: string
  bu: string
}

const SUGGESTIONS = [
  'What are the biggest risks for this account?',
  'How should I prepare for my next meeting?',
  'What upsell opportunities exist?',
  'Who are the key decision makers?',
]

export function AccountChatPanel({ customerName, bu: _bu }: AccountChatPanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMessage: Message = { role: 'user', content: trimmed }
      const history = [...messages]

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setLoading(true)

      // Append a placeholder assistant message for streaming
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      try {
        const response = await fetch(
          `/api/accounts/${encodeURIComponent(customerName)}/chat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: trimmed, history }),
          }
        )

        if (!response.ok || !response.body) {
          const errorText = await response.text().catch(() => 'Unknown error')
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: `Sorry, I encountered an error. ${errorText}`,
            }
            return updated
          })
          setLoading(false)
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk,
              }
            }
            return updated
          })
        }
      } catch (error) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Sorry, I encountered a network error. Please try again.',
          }
          return updated
        })
        console.error('[AccountChatPanel] Fetch error:', error)
      } finally {
        setLoading(false)
      }
    },
    [messages, loading, customerName]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const isLastMessageStreaming =
    loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant'
  const showTypingIndicator = isLastMessageStreaming && messages[messages.length - 1].content === ''

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {/* Expanded chat panel */}
      {open && (
        <div
          style={{
            width: '360px',
            height: '520px',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.12)',
            marginBottom: '0.75rem',
            overflow: 'hidden',
            border: '1px solid var(--border, #e8e6e1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'var(--secondary, #2d4263)',
              color: '#ffffff',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                Ask about {customerName}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>
                AI Account Strategist
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                opacity: 0.8,
              }}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {messages.length === 0 && (
              <div>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--muted, #8b8b8b)',
                    marginBottom: '0.75rem',
                    textAlign: 'center',
                  }}
                >
                  Ask me anything about this account
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestion(suggestion)}
                      style={{
                        background: 'var(--highlight, #ecdbba)',
                        border: '1px solid var(--border, #e8e6e1)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.8rem',
                        color: 'var(--ink, #1a1a1a)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        lineHeight: 1.4,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          '#e0ccaa'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          'var(--highlight, #ecdbba)'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'
              const isStreamingThis =
                !isUser && idx === messages.length - 1 && showTypingIndicator

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: isUser
                        ? '12px 12px 2px 12px'
                        : '12px 12px 12px 2px',
                      background: isUser
                        ? 'var(--accent, #c84b31)'
                        : 'var(--highlight, #ecdbba)',
                      color: isUser ? '#ffffff' : 'var(--ink, #1a1a1a)',
                      fontSize: '0.83rem',
                      lineHeight: 1.55,
                      wordBreak: 'break-word',
                    }}
                  >
                    {isStreamingThis ? <TypingIndicator /> : msg.content}
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              borderTop: '1px solid var(--border, #e8e6e1)',
              padding: '0.75rem',
              background: '#ffffff',
              flexShrink: 0,
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid var(--border, #e8e6e1)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.83rem',
                lineHeight: 1.5,
                fontFamily: 'DM Sans, sans-serif',
                color: 'var(--ink, #1a1a1a)',
                background: '#fafaf8',
                outline: 'none',
                maxHeight: '96px',
                overflowY: 'auto',
              }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 96) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              style={{
                background:
                  !input.trim() || loading
                    ? 'var(--muted, #8b8b8b)'
                    : 'var(--accent, #c84b31)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button (collapsed state) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open account chat"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--accent, #c84b31)',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(200,75,49,0.4)',
            transition: 'background 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = '#b03d25'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'var(--accent, #c84b31)'
          }}
        >
          <MessageCircle size={22} />
        </button>
      )}
    </div>
  )
}

/** Animated typing indicator — three bouncing dots */
function TypingIndicator() {
  return (
    <div
      style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '20px' }}
      aria-label="Thinking..."
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--secondary, #2d4263)',
            display: 'inline-block',
            animation: `chatDotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes chatDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
