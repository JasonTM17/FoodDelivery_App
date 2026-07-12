'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ApiClientError, type AiChatHistory, type AiChatReply } from '@foodflow/api-client'
import { Loader2, MessageCircle, RefreshCw, Send, Sparkles, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { loadAiChatHistory, sendAiChatMessage } from '@/lib/ai-chat-send'
import { cn } from '@/lib/utils'

export type ChatbotMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export type AiChatbotWidgetProps = {
  /** Override for tests; production always calls the authenticated FoodFlow API. */
  sendChat?: (message: string, sessionId?: string) => Promise<AiChatReply>
  loadHistory?: (sessionId?: string) => Promise<AiChatHistory>
  className?: string
}

function defaultSendChat(message: string, sessionId?: string): Promise<AiChatReply> {
  return sendAiChatMessage(
    (path, body) => api.post<AiChatReply>(path, body),
    message,
    sessionId,
  )
}

function defaultLoadHistory(sessionId?: string): Promise<AiChatHistory> {
  return loadAiChatHistory(
    (path) => api.get<AiChatHistory>(path),
    sessionId,
  )
}

export function AiChatbotWidget({
  sendChat = defaultSendChat,
  loadHistory = defaultLoadHistory,
  className,
}: AiChatbotWidgetProps) {
  const t = useTranslations('chatbot')
  const panelId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [messages, setMessages] = useState<ChatbotMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const loadPersistedHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const history = await loadHistory(sessionId)
      setSessionId(history.sessionId ?? sessionId)
      setMessages(history.messages.map((message) => ({
        id: `history-${message.id}`,
        role: message.role,
        content: message.content,
      })))
      setHistoryLoaded(true)
    } catch {
      setHistoryError(t('historyError'))
    } finally {
      setHistoryLoading(false)
    }
  }, [loadHistory, sessionId, t])

  useEffect(() => {
    if (!open || historyLoaded) return
    void loadPersistedHistory()
  }, [historyLoaded, loadPersistedHistory, open])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  const openPanel = useCallback(() => {
    setError(null)
    setOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setError(null)
    setOpen(false)
    window.requestAnimationFrame(() => fabRef.current?.focus())
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending || historyLoading) return

    const userMsg: ChatbotMessage = {
      id: `u-${crypto.randomUUID()}`,
      role: 'user',
      content: text,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)
    setError(null)

    try {
      const reply = await sendChat(text, sessionId)
      const content = reply.reply?.trim()
      if (!content) throw new Error('AI_EMPTY_REPLY')
      setSessionId(reply.sessionId)
      setMessages((prev) => [...prev, {
        id: `a-${crypto.randomUUID()}`,
        role: 'assistant',
        content,
      }])
    } catch (cause) {
      setError(chatErrorMessage(cause, t))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [historyLoading, input, sending, sendChat, sessionId, t])

  const suggestions = [t('suggestionOne'), t('suggestionTwo'), t('suggestionThree')]

  return (
    <div
      className={cn('fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6', className)}
      data-testid="ai-chatbot-root"
    >
      {open ? (
        <section
          id={panelId}
          role="dialog"
          aria-label={t('title')}
          aria-describedby={`${panelId}-subtitle`}
          data-testid="ai-chatbot-panel"
          className="flex h-[min(34rem,calc(100dvh-7.5rem))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-lg"
          onKeyDown={(event) => {
            if (event.key === 'Escape') closePanel()
          }}
        >
          <header className="flex items-start justify-between gap-3 border-b border-border/80 bg-muted/20 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
              </div>
              <p id={`${panelId}-subtitle`} className="mt-1 text-xs leading-5 text-muted-foreground">{t('subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('close')}
              data-testid="ai-chatbot-close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-3 py-4" data-testid="ai-chatbot-messages" role="log" aria-live="polite">
            {historyLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground" data-testid="ai-chatbot-history-loading">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t('historyLoading')}
              </div>
            ) : null}

            {historyError ? (
              <div className="mx-1 flex items-start justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-foreground" role="alert">
                <p className="leading-5">{historyError}</p>
                <button
                  type="button"
                  onClick={() => void loadPersistedHistory()}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-amber-300"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('retryHistory')}
                </button>
              </div>
            ) : null}

            {!historyLoading && messages.length === 0 ? (
              <div className="space-y-4 px-2 py-6">
                <p className="text-center text-sm leading-6 text-muted-foreground">{t('empty')}</p>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t('suggestions')}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setInput(suggestion)
                          inputRef.current?.focus()
                        }}
                        className="min-h-10 rounded-lg border border-border bg-card px-3 text-left text-xs leading-5 text-foreground transition-colors hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  data-testid={`ai-chatbot-msg-${message.role}`}
                  className={cn(
                    'max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-6',
                    message.role === 'user' && 'ml-auto rounded-br-md bg-primary text-primary-foreground',
                    message.role === 'assistant' && 'mr-auto rounded-bl-md border border-border/70 bg-muted/45 text-foreground',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              ))}
            </div>
            {historyLoaded ? <span className="sr-only">{t('conversationLoaded')}</span> : null}
          </div>

          {error ? (
            <p className="mx-3 mb-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm leading-5 text-destructive" role="alert" data-testid="ai-chatbot-error">
              {error}
            </p>
          ) : null}

          <form
            className="flex items-end gap-2 border-t border-border/80 bg-background p-3"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSend()
            }}
          >
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor={`${panelId}-input`}>{t('placeholder')}</label>
              <textarea
                id={`${panelId}-input`}
                ref={inputRef}
                rows={1}
                maxLength={4000}
                value={input}
                disabled={sending || historyLoading}
                aria-describedby={`${panelId}-character-count`}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleSend()
                  }
                }}
                placeholder={t('placeholder')}
                data-testid="ai-chatbot-input"
                className="max-h-28 min-h-11 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-base leading-6 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p id={`${panelId}-character-count`} className="mt-1 text-right text-[11px] tabular-nums text-muted-foreground">
                {t('characterCount', { count: input.length, limit: 4000 })}
              </p>
            </div>
            <button
              type="submit"
              disabled={sending || historyLoading || !input.trim()}
              data-testid="ai-chatbot-send"
              aria-label={t('send')}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            </button>
          </form>
          {sending ? <p className="sr-only" role="status">{t('sending')}</p> : null}
        </section>
      ) : null}

      <button
        ref={fabRef}
        type="button"
        onClick={open ? closePanel : openPanel}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? t('close') : t('open')}
        data-testid="ai-chatbot-fab"
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full border border-primary/15 bg-primary text-primary-foreground shadow-md transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <MessageCircle className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  )
}

function chatErrorMessage(error: unknown, t: ReturnType<typeof useTranslations<'chatbot'>>): string {
  if (error instanceof ApiClientError && error.code === 'AI_PROVIDER_NOT_CONFIGURED') {
    return t('providerNotConfigured')
  }
  return t('providerUnavailable')
}
