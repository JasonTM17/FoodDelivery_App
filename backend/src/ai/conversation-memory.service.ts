import { Injectable, Inject } from '@nestjs/common'
import type Redis from 'ioredis'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const KEY_PREFIX = 'chat:memory:'
const MAX_MESSAGES = 10
const TTL_SECONDS = 3600

@Injectable()
export class ConversationMemoryService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private key(sessionId: string): string {
    return `${KEY_PREFIX}${sessionId}`
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const raw = await this.redis.get(this.key(sessionId))
    if (!raw) return []
    try {
      return JSON.parse(raw) as ChatMessage[]
    } catch {
      return []
    }
  }

  async append(sessionId: string, message: ChatMessage): Promise<void> {
    const history = await this.getHistory(sessionId)
    history.push(message)
    const trimmed = history.slice(-MAX_MESSAGES)
    await this.redis.set(this.key(sessionId), JSON.stringify(trimmed), 'EX', TTL_SECONDS)
  }

  async appendBatch(sessionId: string, messages: ChatMessage[]): Promise<void> {
    const history = await this.getHistory(sessionId)
    const updated = [...history, ...messages].slice(-MAX_MESSAGES)
    await this.redis.set(this.key(sessionId), JSON.stringify(updated), 'EX', TTL_SECONDS)
  }

  async clear(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId))
  }

  async ttlRemaining(sessionId: string): Promise<number> {
    return this.redis.ttl(this.key(sessionId))
  }
}
