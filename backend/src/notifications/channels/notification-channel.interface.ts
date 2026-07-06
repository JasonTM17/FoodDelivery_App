export interface ChannelPayload {
  title: string
  body: string
  data?: Record<string, unknown>
  notification?: Record<string, unknown>
  critical?: boolean
}

export interface ChannelResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface NotificationChannel {
  readonly name: string
  send(userId: string, payload: ChannelPayload): Promise<ChannelResult>
}
