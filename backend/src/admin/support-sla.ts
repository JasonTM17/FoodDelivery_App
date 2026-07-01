import { TicketPriority } from '@prisma/client'

const ICT_OFFSET_MS = 7 * 60 * 60 * 1000
const OPEN_HOUR = 8
const CLOSE_HOUR = 20
const SLA_MINUTES: Record<TicketPriority, number> = {
  critical: 60,
  high: 240,
  medium: 480,
  low: 720,
}

export function calculateSupportSlaDeadline(createdAt: Date, priority: TicketPriority): Date {
  let cursor = toIctClock(createdAt)
  let remaining = SLA_MINUTES[priority]

  while (remaining > 0) {
    cursor = nextBusinessMoment(cursor)
    const close = new Date(cursor)
    close.setUTCHours(CLOSE_HOUR, 0, 0, 0)
    const available = Math.max(0, Math.floor((close.getTime() - cursor.getTime()) / 60_000))
    const consumed = Math.min(remaining, available)
    cursor = new Date(cursor.getTime() + consumed * 60_000)
    remaining -= consumed
    if (remaining > 0) {
      cursor.setUTCDate(cursor.getUTCDate() + 1)
      cursor.setUTCHours(OPEN_HOUR, 0, 0, 0)
    }
  }

  return new Date(cursor.getTime() - ICT_OFFSET_MS)
}

export function shiftDeadlineForWaiting(deadline: Date | null, waitingStartedAt: Date | null): Date | null {
  if (!deadline || !waitingStartedAt) return deadline
  return new Date(deadline.getTime() + Math.max(0, Date.now() - waitingStartedAt.getTime()))
}

function toIctClock(date: Date): Date {
  return new Date(date.getTime() + ICT_OFFSET_MS)
}

function nextBusinessMoment(date: Date): Date {
  const value = new Date(date)
  while (value.getUTCDay() === 0) {
    value.setUTCDate(value.getUTCDate() + 1)
    value.setUTCHours(OPEN_HOUR, 0, 0, 0)
  }
  const hour = value.getUTCHours()
  if (hour < OPEN_HOUR) value.setUTCHours(OPEN_HOUR, 0, 0, 0)
  if (hour >= CLOSE_HOUR) {
    value.setUTCDate(value.getUTCDate() + 1)
    value.setUTCHours(OPEN_HOUR, 0, 0, 0)
    return nextBusinessMoment(value)
  }
  return value
}
