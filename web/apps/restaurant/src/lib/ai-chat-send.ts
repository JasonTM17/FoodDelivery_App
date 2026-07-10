import type { AiChatRequest, AiChatReply } from '@foodflow/api-client'

/** Injectable POST for unit tests — real path is `/ai/chat`. */
export type AiChatPoster = (
  path: string,
  body: AiChatRequest,
) => Promise<AiChatReply>

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
  return post('/ai/chat', {
    message: trimmed,
    ...(sessionId ? { sessionId } : {}),
  })
}

export function isDegradedAiReply(reply: Pick<AiChatReply, 'action'>): boolean {
  return reply.action === 'degraded'
}
