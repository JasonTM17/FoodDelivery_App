export const QUEUE_FCM = 'notifications-fcm'
export const QUEUE_SMTP = 'notifications-smtp'
export const QUEUE_TWILIO = 'notifications-twilio'

export const DEDUP_TTL_SECONDS = 300
export const QUIET_HOUR_START = 22
export const QUIET_HOUR_END = 7
export const FCM_BATCH_SIZE = 500
export const TWILIO_DAILY_USD_CAP = 5

export enum EventType {
  ORDER_CREATED = 'order_created',
  ORDER_ACCEPTED = 'order_accepted',
  DRIVER_ASSIGNED = 'driver_assigned',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PROMO_NEW = 'promo_new',
  KYC_APPROVED = 'kyc_approved',
  SYSTEM_ALERT = 'system_alert',
}

export const CRITICAL_EVENTS = new Set<string>([
  EventType.CANCELLED,
  EventType.REFUNDED,
  EventType.KYC_APPROVED,
])

export const DEFAULT_CHANNELS: Record<string, string[]> = {
  [EventType.ORDER_CREATED]:  ['in_app', 'push'],
  [EventType.ORDER_ACCEPTED]: ['in_app', 'push'],
  [EventType.DRIVER_ASSIGNED]:['in_app', 'push'],
  [EventType.DELIVERED]:      ['in_app', 'push', 'email'],
  [EventType.CANCELLED]:      ['in_app', 'push', 'email', 'sms'],
  [EventType.REFUNDED]:       ['in_app', 'push', 'email', 'sms'],
  [EventType.PROMO_NEW]:      ['in_app', 'push'],
  [EventType.KYC_APPROVED]:   ['in_app', 'push', 'sms'],
  [EventType.SYSTEM_ALERT]:   ['in_app'],
}
