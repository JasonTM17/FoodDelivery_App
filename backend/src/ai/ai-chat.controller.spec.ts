import { AiChatController } from './ai-chat.controller'
import { AiChatService } from './ai-chat.service'

describe('AiChatController', () => {
  const chat = {
    validateMessage: jest.fn(),
    createReply: jest.fn(),
  }
  const controller = new AiChatController(chat as unknown as AiChatService)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('streams thinking, tokens, escalation and done events', async () => {
    chat.createReply.mockResolvedValue({
      reply: 'Hello support',
      sessionId: 'session-1',
      action: 'escalated',
      escalated: true,
      severity: 'HIGH',
    })
    const response = makeSseResponse()

    await controller.stream(
      { message: 'Need help', sessionId: 'session-1' },
      { sub: 'user-1', role: 'customer' },
      response as never,
    )

    expect(chat.validateMessage).toHaveBeenCalledWith('Need help', 'user-1')
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream; charset=utf-8')
    expect(response.write.mock.calls.map(call => call[0])).toEqual([
      'data: {"type":"thinking","content":""}\n\n',
      'data: {"type":"token","content":"Hello"}\n\n',
      'data: {"type":"token","content":" "}\n\n',
      'data: {"type":"token","content":"support"}\n\n',
      'data: {"type":"escalated","content":"HIGH"}\n\n',
      'data: {"type":"done","content":""}\n\n',
    ])
    expect(response.end).toHaveBeenCalled()
  })

  it('streams a degraded event when the AI service reports degraded state', async () => {
    chat.createReply.mockResolvedValue({
      reply: 'AI service unavailable',
      sessionId: 'session-1',
      action: 'degraded',
    })
    const response = makeSseResponse()

    await controller.stream(
      { message: 'Need help', sessionId: 'session-1' },
      { sub: 'user-1', role: 'customer' },
      response as never,
    )

    expect(response.write.mock.calls.map(call => call[0])).toContain(
      'data: {"type":"degraded","content":"AI_SERVICE_UNAVAILABLE"}\n\n',
    )
    expect(response.end).toHaveBeenCalled()
  })
})

function makeSseResponse() {
  return {
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  } as {
    setHeader: jest.Mock
    flushHeaders: jest.Mock
    write: jest.Mock
    end: jest.Mock
  }
}
