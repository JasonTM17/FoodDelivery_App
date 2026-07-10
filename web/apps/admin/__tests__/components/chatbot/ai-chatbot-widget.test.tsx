import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AiChatbotWidget } from '@/components/chatbot/ai-chatbot-widget'
import type { AiChatReply } from '@foodflow/api-client'

describe('AiChatbotWidget', () => {
  it('opens and closes the floating panel from the FAB', () => {
    render(<AiChatbotWidget sendChat={vi.fn()} />)

    expect(screen.queryByTestId('ai-chatbot-panel')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))
    expect(screen.getByTestId('ai-chatbot-panel')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('ai-chatbot-close'))
    expect(screen.queryByTestId('ai-chatbot-panel')).not.toBeInTheDocument()
  })

  it('sends a message through sendChat and renders the assistant reply', async () => {
    const sendChat = vi.fn().mockResolvedValue({
      reply: 'Order #42 is preparing',
      sessionId: 'sess-live-1',
      action: 'answered',
      language: 'en',
    } satisfies AiChatReply)

    render(<AiChatbotWidget sendChat={sendChat} />)
    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))

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

  it('shows degraded badge when API returns action degraded', async () => {
    const sendChat = vi.fn().mockResolvedValue({
      reply: 'AI service unavailable right now.',
      sessionId: 'sess-deg',
      action: 'degraded',
      language: 'en',
    } satisfies AiChatReply)

    render(<AiChatbotWidget sendChat={sendChat} />)
    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))
    fireEvent.change(screen.getByTestId('ai-chatbot-input'), {
      target: { value: 'help' },
    })
    fireEvent.click(screen.getByTestId('ai-chatbot-send'))

    expect(await screen.findByText('AI service unavailable right now.')).toBeInTheDocument()
    expect(screen.getByText('degraded')).toBeInTheDocument()
  })

  it('shows an honest error system message when sendChat rejects', async () => {
    const sendChat = vi.fn().mockRejectedValue(new Error('network'))

    render(<AiChatbotWidget sendChat={sendChat} />)
    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))
    fireEvent.change(screen.getByTestId('ai-chatbot-input'), {
      target: { value: 'ping' },
    })
    fireEvent.click(screen.getByTestId('ai-chatbot-send'))

    expect(await screen.findByText('error')).toBeInTheDocument()
    expect(sendChat).toHaveBeenCalled()
  })
})
