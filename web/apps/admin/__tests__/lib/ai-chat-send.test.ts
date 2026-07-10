import { describe, expect, it, vi } from 'vitest'
import { loadAiChatHistory, sendAiChatMessage } from '@/lib/ai-chat-send'

describe('sendAiChatMessage', () => {
  const sessionId = '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10'
  const previousSessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

  it('posts trimmed message to /ai/chat via the provided poster', async () => {
    const post = vi.fn().mockResolvedValue({
      reply: 'Xin chào!',
      sessionId,
      action: 'answered',
      language: 'vi',
    })

    const result = await sendAiChatMessage(post, '  hello  ', previousSessionId)

    expect(post).toHaveBeenCalledWith('/ai/chat', {
      message: 'hello',
      sessionId: previousSessionId,
    })
    expect(result.reply).toBe('Xin chào!')
    expect(result.action).toBe('answered')
  })

  it('rejects a malformed runtime reply instead of storing a fake session', async () => {
    const post = vi.fn().mockResolvedValue({
      reply: 'Unsafe contract',
      sessionId: 'browser-session',
      action: 'answered',
      language: 'vi',
    })

    await expect(sendAiChatMessage(post, 'hello')).rejects.toThrow('AI_CHAT_INVALID_SESSION')
  })

  it('rejects blank messages without calling the network', async () => {
    const post = vi.fn()
    await expect(sendAiChatMessage(post, '   ')).rejects.toThrow('MESSAGE_REQUIRED')
    expect(post).not.toHaveBeenCalled()
  })

  it('loads only the server-owned chat history and encodes a selected session id', async () => {
    const get = vi.fn().mockResolvedValue({ sessionId, messages: [] })

    await loadAiChatHistory(get, sessionId)

    expect(get).toHaveBeenCalledWith(`/ai/history?sessionId=${sessionId}`)
  })

  it('rejects malformed server history instead of rendering unowned messages', async () => {
    const get = vi.fn().mockResolvedValue({ sessionId: 'browser-session', messages: [] })

    await expect(loadAiChatHistory(get)).rejects.toThrow('AI_CHAT_INVALID_HISTORY_SESSION')
  })
})
