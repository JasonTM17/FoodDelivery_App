import { HttpException, HttpStatus } from '@nestjs/common'
import { AiChatController } from './ai-chat.controller'
import { AiChatService } from './ai-chat.service'

describe('AiChatController', () => {
  const chat = {
    createReply: jest.fn(),
  }
  const controller = new AiChatController(chat as unknown as AiChatService)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('emits the completed, safety-filtered provider response without fabricating word tokens', async () => {
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

    expect(chat.createReply).toHaveBeenCalledWith(
      { message: 'Need help', sessionId: 'session-1' },
      { sub: 'user-1', role: 'customer' },
    )
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream; charset=utf-8')
    expect(response.write.mock.calls.map(call => call[0])).toEqual([
      'data: {"type":"thinking","content":""}\n\n',
      'data: {"type":"response","content":"Hello support"}\n\n',
      'data: {"type":"escalated","content":"HIGH"}\n\n',
      'data: {"type":"done","content":""}\n\n',
    ])
    expect(response.end).toHaveBeenCalled()
  })

  it('does not generate a fallback reply when the provider fails after headers are flushed', async () => {
    chat.createReply.mockRejectedValue(new Error('provider unavailable'))
    const response = makeSseResponse()

    await controller.stream(
      { message: 'Need help', sessionId: 'session-1' },
      { sub: 'user-1', role: 'customer' },
      response as never,
    )

    expect(response.write.mock.calls.map(call => call[0])).toEqual([
      'data: {"type":"thinking","content":""}\n\n',
      'data: {"type":"error","content":"AI_PROVIDER_UNAVAILABLE"}\n\n',
      'data: {"type":"done","content":""}\n\n',
    ])
    expect(response.end).toHaveBeenCalled()
  })

  it('preserves an allow-listed provider configuration code in the SSE error event', async () => {
    chat.createReply.mockRejectedValue(new HttpException({
      code: 'AI_PROVIDER_NOT_CONFIGURED',
      message: 'AI_PROVIDER_NOT_CONFIGURED',
    }, HttpStatus.SERVICE_UNAVAILABLE))
    const response = makeSseResponse()

    await controller.stream(
      { message: 'Need help' },
      { sub: 'user-1', role: 'customer' },
      response as never,
    )

    expect(response.write.mock.calls.map(call => call[0])).toEqual([
      'data: {"type":"thinking","content":""}\n\n',
      'data: {"type":"error","content":"AI_PROVIDER_NOT_CONFIGURED"}\n\n',
      'data: {"type":"done","content":""}\n\n',
    ])
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
