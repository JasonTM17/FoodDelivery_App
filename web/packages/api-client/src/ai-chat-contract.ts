import type { AiChatHistory, AiChatHistoryMessage, AiChatReply } from './types'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function assertAiChatSessionId(value: string): void {
  if (!UUID_PATTERN.test(value)) throw new Error('INVALID_SESSION_ID')
}

export function parseAiChatReply(value: unknown): AiChatReply {
  const record = asRecord(value, 'AI_CHAT_INVALID_REPLY')
  const reply = nonEmptyString(record.reply, 'AI_CHAT_INVALID_REPLY')
  const sessionId = nonEmptyString(record.sessionId, 'AI_CHAT_INVALID_SESSION')
  if (!UUID_PATTERN.test(sessionId)) throw new Error('AI_CHAT_INVALID_SESSION')
  if (record.action !== 'answered' && record.action !== 'escalated') {
    throw new Error('AI_CHAT_INVALID_ACTION')
  }
  if (record.language !== 'vi' && record.language !== 'en' && record.language !== 'ja') {
    throw new Error('AI_CHAT_INVALID_LANGUAGE')
  }

  return {
    ...(record as unknown as AiChatReply),
    reply,
    sessionId,
    action: record.action,
    language: record.language,
  }
}

export function parseAiChatHistory(value: unknown): AiChatHistory {
  const record = asRecord(value, 'AI_CHAT_INVALID_HISTORY')
  if (record.sessionId !== null && typeof record.sessionId !== 'string') {
    throw new Error('AI_CHAT_INVALID_HISTORY_SESSION')
  }
  if (typeof record.sessionId === 'string' && !UUID_PATTERN.test(record.sessionId)) {
    throw new Error('AI_CHAT_INVALID_HISTORY_SESSION')
  }
  if (!Array.isArray(record.messages) || record.messages.length > 50) {
    throw new Error('AI_CHAT_INVALID_HISTORY')
  }

  return {
    sessionId: record.sessionId,
    messages: record.messages.map(parseHistoryMessage),
  }
}

function parseHistoryMessage(value: unknown): AiChatHistoryMessage {
  const record = asRecord(value, 'AI_CHAT_INVALID_HISTORY_MESSAGE')
  const id = nonEmptyString(record.id, 'AI_CHAT_INVALID_HISTORY_MESSAGE')
  if (!UUID_PATTERN.test(id)) throw new Error('AI_CHAT_INVALID_HISTORY_MESSAGE')
  if (record.role !== 'user' && record.role !== 'assistant') {
    throw new Error('AI_CHAT_INVALID_HISTORY_MESSAGE')
  }
  const content = nonEmptyString(record.content, 'AI_CHAT_INVALID_HISTORY_MESSAGE')
  const createdAt = nonEmptyString(record.createdAt, 'AI_CHAT_INVALID_HISTORY_MESSAGE')
  if (Number.isNaN(Date.parse(createdAt))) throw new Error('AI_CHAT_INVALID_HISTORY_MESSAGE')

  return { id, role: record.role, content, createdAt }
}

function asRecord(value: unknown, code: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(code)
  return value as Record<string, unknown>
}

function nonEmptyString(value: unknown, code: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(code)
  return value.trim()
}
