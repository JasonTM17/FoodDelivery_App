import {
  assertAiChatSessionId,
  parseAiChatHistory,
  parseAiChatReply,
  type AiChatHistory,
  type AiChatRequest,
  type AiChatReply,
} from '@foodflow/api-client'

/** Injectable POST for unit tests — real path is `/ai/chat`. */
export type AiChatPoster = (
  path: string,
  body: AiChatRequest,
) => Promise<AiChatReply>

/** Injectable GET for unit tests — real path is `/ai/history`. */
export type AiChatHistoryGetter = (path: string) => Promise<AiChatHistory>

/**
 * Sends one user message to the authenticated AI chat endpoint.
 * Does not fabricate replies — callers must render the returned payload or errors.
 */
export async function sendAiChatMessage(
  post: AiChatPoster,
  message: string,
  sessionId?: string,
): Promise<AiChatReply> {
  const trimmed = message.trim()
  if (!trimmed) {
    throw new Error('MESSAGE_REQUIRED')
  }
  if (trimmed.length > 4000) throw new Error('MESSAGE_TOO_LONG')
  if (sessionId) assertAiChatSessionId(sessionId)
  const response = await post('/ai/chat', {
    message: trimmed,
    ...(sessionId ? { sessionId } : {}),
  })
  return parseAiChatReply(response)
}

/**
 * Loads only the active user's persisted support history. The backend enforces
 * ownership and returns an empty history rather than inventing placeholder turns.
 */
export async function loadAiChatHistory(
  get: AiChatHistoryGetter,
  sessionId?: string,
): Promise<AiChatHistory> {
  if (sessionId) assertAiChatSessionId(sessionId)
  const response = await get(sessionId ? `/ai/history?sessionId=${encodeURIComponent(sessionId)}` : '/ai/history')
  return parseAiChatHistory(response)
}
