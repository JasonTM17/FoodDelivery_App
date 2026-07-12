import { ConfigService } from '@nestjs/config'
import { DeepSeekChatProviderService } from './deepseek-chat-provider.service'

describe('DeepSeekChatProviderService', () => {
  const config = { get: jest.fn() }
  const ragRetrieval = { search: jest.fn(), formatForPrompt: jest.fn() }
  const service = new DeepSeekChatProviderService(config as never, ragRetrieval as never)
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    config.get.mockImplementation((key: string) => ({
      DEEPSEEK_API_KEY: 'test-key',
    }[key]))
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
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
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Previous question' },
      expect.objectContaining({ role: 'user', content: expect.stringContaining('Order ID provided by user: order-1') }),
    ]))
    expect(body.messages.at(-1).content).toContain('VERIFIED_CONTEXT=')
    expect(body.messages.at(-1).content).toContain('"getOrderStatus"')
    expect(result).toEqual({ reply: 'Your order is being checked.', escalated: false, severity: undefined })
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

  it('supports explicit base URL, model and thinking settings', async () => {
    config.get.mockImplementation((key: string) => ({
      DEEPSEEK_API_KEY: 'test-key',
      DEEPSEEK_BASE_URL: 'https://deepseek.example.test/',
      DEEPSEEK_MODEL: 'deepseek-v4-pro',
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

    expect(global.fetch).toHaveBeenCalledWith('https://deepseek.example.test/chat/completions', expect.any(Object))
    expect(body).toMatchObject({
      model: 'deepseek-v4-pro',
      thinking: { type: 'enabled' },
      reasoning_effort: 'max',
      max_tokens: 1200,
    })
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
})
