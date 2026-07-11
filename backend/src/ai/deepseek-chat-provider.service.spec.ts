import { ConfigService } from '@nestjs/config'
import { DeepSeekChatProviderService } from './deepseek-chat-provider.service'

describe('DeepSeekChatProviderService', () => {
  const config = { get: jest.fn() }
  const service = new DeepSeekChatProviderService(config as unknown as ConfigService)
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    config.get.mockImplementation((key: string) => ({
      DEEPSEEK_API_KEY: 'test-key',
    }[key]))
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: 'deepseek-v4-flash',
        usage: { prompt_tokens: 91, completion_tokens: 33 },
        choices: [{ message: { content: '  Your order is being checked.  ' } }],
      }),
    })
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('calls the DeepSeek chat completion API with v4 flash defaults and no secret in body', async () => {
    const result = await service.createReply({
      message: 'Where is my order?',
      sessionId: 'session-1',
      orderId: 'order-1',
      userId: 'user-1',
      actorRole: 'customer',
      sentimentLabel: 'neutral',
      history: [
        { role: 'assistant', content: 'Hello' },
        { role: 'tool', content: 'ignored tool turn' },
        { role: 'user', content: 'Previous question' },
      ],
      grounding: [{ tool: 'getOrderStatus', data: { status: 'preparing' } }],
    })
    const [, options] = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(options.body)

    expect(global.fetch).toHaveBeenCalledWith('https://api.deepseek.com/chat/completions', expect.objectContaining({
      method: 'POST',
      redirect: 'error',
      headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
    }))
    expect(body).toMatchObject({
      model: 'deepseek-v4-flash',
      stream: false,
      thinking: { type: 'disabled' },
    })
    expect(JSON.stringify(body)).not.toContain('test-key')
    expect(body.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('Only state account-specific facts that appear in VERIFIED_CONTEXT.'),
      }),
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('If getRecommendedFoods returns an empty items list'),
      }),
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('authenticated actor is a customer'),
      }),
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Previous question' },
      expect.objectContaining({ role: 'user', content: expect.stringContaining('Order ID provided by user: order-1') }),
    ]))
    expect(body.messages.at(-1).content).toContain('VERIFIED_CONTEXT=')
    expect(body.messages.at(-1).content).toContain('"getOrderStatus"')
    expect(result).toEqual({
      reply: 'Your order is being checked.',
      escalated: false,
      severity: undefined,
      model: 'deepseek-v4-flash',
      inputTokens: 91,
      outputTokens: 33,
    })
  })

  it('throws explicit configuration error before calling the network when key is missing', async () => {
    config.get.mockReturnValue(undefined)

    await expect(service.createReply({
      message: 'Need help',
      sessionId: 'session-1',
      userId: 'user-1',
      sentimentLabel: 'neutral',
      history: [],
    })).rejects.toThrow('DEEPSEEK_NOT_CONFIGURED')

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('supports approved thinking settings while keeping the fixed Flash model and official origin', async () => {
    config.get.mockImplementation((key: string) => ({
      DEEPSEEK_API_KEY: 'test-key',
      DEEPSEEK_BASE_URL: 'https://api.deepseek.com/',
      DEEPSEEK_MODEL: 'deepseek-v4-flash',
      DEEPSEEK_THINKING: 'enabled',
      DEEPSEEK_REASONING_EFFORT: 'max',
      DEEPSEEK_MAX_OUTPUT_TOKENS: '1200',
    }[key]))

    await service.createReply({
      message: 'Need help',
      sessionId: 'session-1',
      userId: 'user-1',
      sentimentLabel: 'angry',
      history: [],
    })
    const [, options] = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(options.body)

    expect(global.fetch).toHaveBeenCalledWith('https://api.deepseek.com/chat/completions', expect.any(Object))
    expect(body).toMatchObject({
      model: 'deepseek-v4-flash',
      thinking: { type: 'enabled' },
      reasoning_effort: 'max',
      max_tokens: 1200,
    })
    expect(service.modelName()).toBe('deepseek-v4-flash')
  })

  it('fails before network access when an override could exfiltrate the key or select another model', async () => {
    config.get.mockImplementation((key: string) => ({
      DEEPSEEK_API_KEY: 'test-key',
      DEEPSEEK_BASE_URL: 'https://attacker.example',
    }[key]))

    await expect(service.createReply({
      message: 'Need help',
      sessionId: 'session-1',
      userId: 'user-1',
      sentimentLabel: 'neutral',
      history: [],
    })).rejects.toThrow('DEEPSEEK_ENDPOINT_NOT_ALLOWED')
    expect(global.fetch).not.toHaveBeenCalled()

    config.get.mockImplementation((key: string) => ({
      DEEPSEEK_API_KEY: 'test-key',
      DEEPSEEK_MODEL: 'deepseek-v4-pro',
    }[key]))

    await expect(service.createReply({
      message: 'Need help',
      sessionId: 'session-1',
      userId: 'user-1',
      sentimentLabel: 'neutral',
      history: [],
    })).rejects.toThrow('DEEPSEEK_MODEL_NOT_ALLOWED')
    expect(global.fetch).not.toHaveBeenCalled()
    expect(service.modelName()).toBe('deepseek-v4-flash')
  })

  it('gives restaurant actors role-specific workflow guidance without claiming live data', async () => {
    await service.createReply({
      message: 'How do I pause a dish?',
      sessionId: 'session-1',
      userId: 'restaurant-user-1',
      actorRole: 'restaurant',
      sentimentLabel: 'neutral',
      history: [],
    })
    const [, options] = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(options.body)
    const systemMessage = body.messages.find((message: { role: string }) => message.role === 'system')

    expect(systemMessage.content).toContain('Restaurant portal workflows')
    expect(systemMessage.content).toContain('Never claim live restaurant data unless it appears in VERIFIED_CONTEXT')
  })

  it('fails closed when DeepSeek returns an error or empty content', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 })
    await expect(service.createReply({
      message: 'Need help',
      sessionId: 'session-1',
      userId: 'user-1',
      sentimentLabel: 'neutral',
      history: [],
    })).rejects.toThrow('DEEPSEEK_ERROR_401')

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: ' ' } }] }),
    })
    await expect(service.createReply({
      message: 'Need help',
      sessionId: 'session-1',
      userId: 'user-1',
      sentimentLabel: 'neutral',
      history: [],
    })).rejects.toThrow('DEEPSEEK_EMPTY_REPLY')
  })

  it('rejects filtered or incomplete provider completions instead of returning partial text', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ finish_reason: 'content_filter', message: { content: 'partial' } }],
      }),
    })
    await expect(service.createReply({
      message: 'Need help',
      sessionId: 'session-1',
      userId: 'user-1',
      sentimentLabel: 'neutral',
      history: [],
    })).rejects.toThrow('DEEPSEEK_CONTENT_FILTERED')

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ finish_reason: 'length', message: { content: 'cut off' } }],
      }),
    })
    await expect(service.createReply({
      message: 'Need help',
      sessionId: 'session-1',
      userId: 'user-1',
      sentimentLabel: 'neutral',
      history: [],
    })).rejects.toThrow('DEEPSEEK_INCOMPLETE_REPLY')
  })
})
