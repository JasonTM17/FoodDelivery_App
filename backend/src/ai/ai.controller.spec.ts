import { AiController } from './ai.controller'
import { AiChatService } from './ai-chat.service'

describe('AiController', () => {
  const chat = {
    createReply: jest.fn(),
  }
  const controller = new AiController(chat as unknown as AiChatService)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('delegates non-stream chatbot replies to AiChatService', async () => {
    chat.createReply.mockResolvedValue({
      reply: 'Tracked by the AI service',
      sessionId: 'session-1',
      action: 'answered',
    })

    const result = await controller.chatOnce(
      { sub: 'user-1', role: 'customer' },
      { message: 'Track my order', sessionId: 'session-1' },
    )

    expect(chat.createReply).toHaveBeenCalledWith(
      { message: 'Track my order', sessionId: 'session-1' },
      { sub: 'user-1', role: 'customer' },
    )
    expect(result.reply).toBe('Tracked by the AI service')
    expect(result.reply).not.toContain('user-1')
  })
})
