import { describe, expect, it, vi } from 'vitest'
import { loadAiChatHistory, sendAiChatMessage } from '@/lib/ai-chat-send'

describe('sendAiChatMessage (restaurant)', () => {
  const sessionId = '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10'
  const previousSessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

  it('posts trimmed message to /ai/chat via the provided poster', async () => {
    const post = vi.fn().mockResolvedValue({
      reply: 'Xin chào đối tác!',
      sessionId,
      action: 'answered',
      language: 'vi',
    })

    const result = await sendAiChatMessage(post, '  hello partner  ', previousSessionId)

    expect(post).toHaveBeenCalledWith('/ai/chat', {
      message: 'hello partner',
      sessionId: previousSessionId,
    })
    expect(result.reply).toBe('Xin chào đối tác!')
  })

  it('rejects blank messages without calling the network', async () => {
    const post = vi.fn()
    await expect(sendAiChatMessage(post, '')).rejects.toThrow('MESSAGE_REQUIRED')
    expect(post).not.toHaveBeenCalled()
  })

  it('loads the active restaurant user history from the authenticated endpoint', async () => {
    const get = vi.fn().mockResolvedValue({ sessionId: null, messages: [] })

    await loadAiChatHistory(get)

    expect(get).toHaveBeenCalledWith('/ai/history')
  })
})
