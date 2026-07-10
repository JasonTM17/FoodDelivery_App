'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AiChatReply } from '@foodflow/api-client'
import { apiPost } from '@/lib/api'
import { isDegradedAiReply, sendAiChatMessage } from '@/lib/ai-chat-send'
import { cn } from '@/lib/utils'

export type ChatbotMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  degraded?: boolean
}

export type AiChatbotWidgetProps = {
  /** Override for tests — must still call the real send helper or equivalent path. */
  sendChat?: (message: string, sessionId?: string) => Promise<AiChatReply>
  className?: string
}

function defaultSendChat(message: string, sessionId?: string): Promise<AiChatReply> {
  return sendAiChatMessage(
    (path, body) => apiPost<AiChatReply>(path, body),
    message,
    sessionId,
  )
}

export function AiChatbotWidget({
  sendChat = defaultSendChat,
  className,
}: AiChatbotWidgetProps) {
  const t = useTranslations('chatbot')
  const panelId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [messages, setMessages] = useState<ChatbotMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  const toggle = useCallback(() => {
    setOpen((v) => !v)
    setError(null)
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: ChatbotMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)
    setError(null)

    try {
      const reply = await sendChat(text, sessionId)
      if (reply.sessionId) setSessionId(reply.sessionId)
      const assistantMsg: ChatbotMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply.reply?.trim() ? reply.reply : t('emptyReply'),
        degraded: isDegradedAiReply(reply),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setError(t('error'))
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'system',
          content: t('error'),
        },
      ])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [input, sending, sendChat, sessionId, t])

  return (
    <div
      className={cn('fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3', className)}
      data-testid="ai-chatbot-root"
    >
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('title')}
          data-testid="ai-chatbot-panel"
          className="flex h-[min(28rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-elevated shadow-glow"
        >
          <header className="flex items-start justify-between gap-2 border-b border-border bg-card px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
              <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t('close')}
              data-testid="ai-chatbot-close"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div
            className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
            data-testid="ai-chatbot-messages"
          >
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground px-2 py-6">{t('empty')}</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  data-testid={`ai-chatbot-msg-${m.role}`}
                  className={cn(
                    'max-w-[90%] rounded-xl px-3 py-2 text-sm',
                    m.role === 'user' && 'ml-auto bg-primary text-primary-foreground',
                    m.role === 'assistant' && 'mr-auto bg-muted text-foreground',
                    m.role === 'system' && 'mx-auto bg-destructive/10 text-destructive text-xs',
                    m.degraded && 'ring-1 ring-amber-500/50',
                  )}
                >
                  {m.degraded ? (
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      {t('degraded')}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              ))
            )}
            {error && messages.every((m) => m.role !== 'system') ? (
              <p className="text-center text-xs text-destructive" data-testid="ai-chatbot-error">
                {error}
              </p>
            ) : null}
          </div>

          <form
            className="flex items-end gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSend()
            }}
          >
            <label className="sr-only" htmlFor={`${panelId}-input`}>
              {t('placeholder')}
            </label>
            <textarea
              id={`${panelId}-input`}
              ref={inputRef}
              rows={1}
              value={input}
              disabled={sending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              placeholder={t('placeholder')}
              data-testid="ai-chatbot-input"
              className="max-h-24 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              data-testid="ai-chatbot-send"
              aria-label={t('send')}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? t('close') : t('open')}
        data-testid="ai-chatbot-fab"
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground',
          'shadow-elevated shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-elevated',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}
