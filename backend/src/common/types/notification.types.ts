export type NotificationType = 'order_update' | 'promotion' | 'system' | 'chat' | 'driver_alert'

export interface CreateNotificationInput {
  userId: string
  title: string
  body: string
  type: NotificationType
  payload?: Record<string, unknown>
}

export interface NotificationResult {
  notifications: Array<{
    id: string
    title: string
    body: string
    type: string
    isRead: boolean
    createdAt: Date
  }>
  unreadCount: number
}
