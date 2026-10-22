'use client'

/**
 * AccountChatPanel — floating per-account question panel
 * Anchored bottom-right of viewport; collapsed = "Ask about this account" button, expanded = panel
 * Uses streaming fetch to /api/accounts/[name]/chat
 *
 * a11y:
 * - Expanded panel is a labeled modal dialog (role=dialog, aria-modal, aria-labelledby).
 * - Escape closes it and returns focus to the trigger button.
 * - Tab cycles through focusable elements inside the panel (focus trap, no library).
 * - Hover swaps moved to CSS so keyboard users get matching :focus-visible feedback.
 * - Typing-indicator animation honors prefers-reduced-motion.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'

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
  const dialogRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

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

  // Return focus to FAB after the panel closes (and the FAB has re-rendered)
  const justClosedRef = useRef(false)
  useEffect(() => {
    if (!open && justClosedRef.current) {
      justClosedRef.current = false
      // Use rAF so the FAB has been re-mounted into the DOM before we focus it
      requestAnimationFrame(() => fabRef.current?.focus())
    }
  }, [open])

  const closePanel = useCallback(() => {
    justClosedRef.current = true
    setOpen(false)
  }, [])

  // Escape-to-close + simple focus trap (Tab / Shift+Tab wrap)
  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closePanel()
        return
      }
      if (e.key !== 'Tab') return

      const root = dialogRef.current
      if (!root) return

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null)

      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, closePanel])

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

  const canSend = !!input.trim() && !loading

  return (
    <div className="chat-root" data-print="hide">
      {/* Component-scoped styles: hover/focus in CSS (no JS hover handlers) and the
          typing-indicator animation gated behind prefers-reduced-motion. */}
      <style>{`
        .chat-root {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          max-width: calc(100vw - 2rem);
        }
        @media (max-width: 480px) {
          .chat-root { bottom: 1rem; right: 1rem; }
        }
        .chat-trigger { box-shadow: var(--shadow-md); }
        .chat-panel {
          width: 380px;
          max-width: calc(100vw - 2rem);
          height: min(540px, calc(100vh - 6rem));
          display: flex;
          flex-direction: column;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          margin-bottom: 0.75rem;
          overflow: hidden;
        }
        .chat-suggestion-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0.5rem 0.75rem;
          font: inherit;
          font-size: 0.8125rem;
          color: var(--ink);
          cursor: pointer;
          text-align: left;
          line-height: 1.4;
          transition: background-color 150ms var(--ease-out), border-color 150ms var(--ease-out);
        }
        .chat-suggestion-btn:hover,
        .chat-suggestion-btn:focus-visible {
          background: var(--highlight);
          border-color: var(--border-strong);
        }
        .chat-input {
          flex: 1;
          resize: none;
          height: auto;
          min-height: 2.25rem;
          max-height: 96px;
          padding: 0.45rem 0.75rem;
          line-height: 1.5;
          overflow-y: auto;
        }
        .chat-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--muted);
          display: inline-block;
        }
        @media (prefers-reduced-motion: no-preference) {
          .chat-typing-dot {
            animation: chatDotPulse 1.2s ease-in-out infinite;
          }
        }
        @keyframes chatDotPulse {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>

      {/* Expanded chat panel */}
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-title"
          aria-describedby="chat-description"
          className="chat-panel"
        >
          {/* Header */}
          <div
            className="flex shrink-0 items-start justify-between gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="min-w-0">
              <h2 id="chat-title" className="m-0 truncate text-[0.9375rem] font-semibold">
                Ask about {customerName}
              </h2>
              <p id="chat-description" className="m-0 mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                Answers draw on this account&apos;s plan and budget data.
              </p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={closePanel}
              className="btn btn-ghost btn-sm shrink-0"
              style={{ padding: '0 0.375rem' }}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 && (
              <div>
                <p className="m-0 mb-2 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
                  Try one of these:
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestion(suggestion)}
                      className="chat-suggestion-btn"
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
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] whitespace-pre-wrap break-words px-3 py-2 text-[0.8125rem]"
                    style={{
                      borderRadius: 'var(--radius-md)',
                      lineHeight: 1.55,
                      background: isUser ? 'var(--secondary-tint)' : 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink)',
                    }}
                  >
                    {isUser && <span className="sr-only">You: </span>}
                    {isStreamingThis ? <TypingIndicator /> : msg.content}
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            className="flex shrink-0 items-end gap-2 p-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question"
              aria-label="Ask a question about this account"
              rows={1}
              className="input chat-input"
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 96) + 'px'
              }}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!canSend}
              aria-label="Send message"
              className="btn btn-primary shrink-0"
              style={{ height: '2.25rem', width: '2.25rem', padding: 0 }}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Trigger button (collapsed state) */}
      {!open && (
        <button
          ref={fabRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="btn chat-trigger"
          style={{ height: '2.5rem', padding: '0 1rem' }}
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Ask about this account
        </button>
      )}
    </div>
  )
}

/** Animated typing indicator — three bouncing dots (motion-safe) */
function TypingIndicator() {
  return (
    <div
      style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '20px' }}
      role="status"
      aria-label="Writing an answer"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="chat-typing-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}
