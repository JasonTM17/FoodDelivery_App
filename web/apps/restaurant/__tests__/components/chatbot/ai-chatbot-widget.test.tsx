import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AiChatbotWidget } from '@/components/chatbot/ai-chatbot-widget'
import type { AiChatHistory, AiChatReply } from '@foodflow/api-client'

vi.mock('next-intl', () => ({
  useLocale: () => 'vi',
  useTranslations: () => (key: string) => key,
}))

const emptyHistory: AiChatHistory = { sessionId: null, messages: [] }

describe('AiChatbotWidget (restaurant)', () => {
  it('opens and closes the floating panel from the FAB', async () => {
    const loadHistory = vi.fn().mockResolvedValue(emptyHistory)
    render(<AiChatbotWidget sendChat={vi.fn()} loadHistory={loadHistory} />)

    expect(screen.queryByTestId('ai-chatbot-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))
    expect(screen.getByTestId('ai-chatbot-panel')).toBeInTheDocument()
    await waitFor(() => expect(loadHistory).toHaveBeenCalled())
    fireEvent.click(screen.getByTestId('ai-chatbot-close'))
    expect(screen.queryByTestId('ai-chatbot-panel')).not.toBeInTheDocument()
  })

  it('sends a message through sendChat and renders the live assistant reply', async () => {
    const sendChat = vi.fn().mockResolvedValue({
      reply: 'Menu item updated guidance',
      sessionId: 'sess-rest-1',
      action: 'answered',
      language: 'en',
    } satisfies AiChatReply)
    const loadHistory = vi.fn().mockResolvedValue(emptyHistory)

    render(<AiChatbotWidget sendChat={sendChat} loadHistory={loadHistory} />)
    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))
    await waitFor(() => expect(screen.queryByTestId('ai-chatbot-history-loading')).not.toBeInTheDocument())
    fireEvent.change(screen.getByTestId('ai-chatbot-input'), {
      target: { value: 'How do I pause a dish?' },
    })
    fireEvent.click(screen.getByTestId('ai-chatbot-send'))

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith('How do I pause a dish?', undefined)
    })
    expect(await screen.findByText('How do I pause a dish?')).toBeInTheDocument()
    expect(await screen.findByText('Menu item updated guidance')).toBeInTheDocument()
  })

  it('shows an honest provider error without inserting a fallback answer', async () => {
    const sendChat = vi.fn().mockRejectedValue(new Error('network'))
    const loadHistory = vi.fn().mockResolvedValue(emptyHistory)

    render(<AiChatbotWidget sendChat={sendChat} loadHistory={loadHistory} />)
    fireEvent.click(screen.getByTestId('ai-chatbot-fab'))
    await waitFor(() => expect(screen.queryByTestId('ai-chatbot-history-loading')).not.toBeInTheDocument())
    fireEvent.change(screen.getByTestId('ai-chatbot-input'), {
      target: { value: 'help' },
    })
    fireEvent.click(screen.getByTestId('ai-chatbot-send'))

    expect(await screen.findByTestId('ai-chatbot-error')).toHaveTextContent('providerUnavailable')
    expect(screen.queryByTestId('ai-chatbot-msg-assistant')).not.toBeInTheDocument()
  })
})
