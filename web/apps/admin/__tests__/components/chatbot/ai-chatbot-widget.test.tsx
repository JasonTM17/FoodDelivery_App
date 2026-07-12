import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AiChatbotWidget } from '@/components/chatbot/ai-chatbot-widget'
import type { AiChatHistory, AiChatReply } from '@foodflow/api-client'

const emptyHistory: AiChatHistory = { sessionId: null, messages: [] }

describe('AiChatbotWidget', () => {
  it('opens, loads the signed-in history, and closes from the FAB', async () => {
    const loadHistory = vi.fn().mockResolvedValue({
      sessionId: 'history-1',
      messages: [{ id: 'a-1', role: 'assistant', content: 'Stored reply', createdAt: '2026-07-10T00:00:00.000Z' }],
    } satisfies AiChatHistory)
    render(<AiChatbotWidget sendChat={vi.fn()} loadHistory={loadHistory} />)

    expect(screen.queryByTestId('ai-chatbot-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))

    expect(await screen.findByText('Stored reply')).toBeInTheDocument()
    expect(loadHistory).toHaveBeenCalledWith(undefined)

    fireEvent.click(screen.getByTestId('ai-chatbot-close'))
    expect(screen.queryByTestId('ai-chatbot-panel')).not.toBeInTheDocument()
  })

  it('sends a message through sendChat and renders the live assistant reply', async () => {
    const sendChat = vi.fn().mockResolvedValue({
      reply: 'Order #42 is preparing',
      sessionId: 'sess-live-1',
      action: 'answered',
      language: 'en',
    } satisfies AiChatReply)
    const loadHistory = vi.fn().mockResolvedValue(emptyHistory)

    render(<AiChatbotWidget sendChat={sendChat} loadHistory={loadHistory} />)
    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))
    await waitFor(() => expect(loadHistory).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByTestId('ai-chatbot-history-loading')).not.toBeInTheDocument())

    fireEvent.change(screen.getByTestId('ai-chatbot-input'), {
      target: { value: 'Where is order 42?' },
    })
    fireEvent.click(screen.getByTestId('ai-chatbot-send'))

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith('Where is order 42?', undefined)
    })
    expect(await screen.findByText('Where is order 42?')).toBeInTheDocument()
    expect(await screen.findByText('Order #42 is preparing')).toBeInTheDocument()
  })

  it('shows an honest error without inserting a synthetic assistant reply', async () => {
    const sendChat = vi.fn().mockRejectedValue(new Error('network'))
    const loadHistory = vi.fn().mockResolvedValue(emptyHistory)

    render(<AiChatbotWidget sendChat={sendChat} loadHistory={loadHistory} />)
    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))
    await waitFor(() => expect(screen.queryByTestId('ai-chatbot-history-loading')).not.toBeInTheDocument())
    fireEvent.change(screen.getByTestId('ai-chatbot-input'), {
      target: { value: 'ping' },
    })
    fireEvent.click(screen.getByTestId('ai-chatbot-send'))

    expect(await screen.findByTestId('ai-chatbot-error')).toHaveTextContent('providerUnavailable')
    expect(screen.queryByTestId('ai-chatbot-msg-assistant')).not.toBeInTheDocument()
    expect(sendChat).toHaveBeenCalled()
  })
})
