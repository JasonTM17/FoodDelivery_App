import { describe, expect, it, vi } from 'vitest'
import {
  isDegradedAiReply,
  sendAiChatMessage,
} from '@/lib/ai-chat-send'

describe('sendAiChatMessage (restaurant)', () => {
  it('posts trimmed message to /ai/chat via the provided poster', async () => {
    const post = vi.fn().mockResolvedValue({
      reply: 'Xin chào đối tác!',
      sessionId: 'sess-r1',
      action: 'answered',
      language: 'vi',
    })

    const result = await sendAiChatMessage(post, '  hello partner  ', 'sess-r0')

    expect(post).toHaveBeenCalledWith('/ai/chat', {
      message: 'hello partner',
      sessionId: 'sess-r0',
    })
    expect(result.reply).toBe('Xin chào đối tác!')
  })

  it('rejects blank messages without calling the network', async () => {
    const post = vi.fn()
    await expect(sendAiChatMessage(post, '')).rejects.toThrow('MESSAGE_REQUIRED')
    expect(post).not.toHaveBeenCalled()
  })

  it('detects degraded action from API payload', () => {
    expect(isDegradedAiReply({ action: 'degraded' })).toBe(true)
    expect(isDegradedAiReply({ action: 'escalated' })).toBe(false)
  })
})
