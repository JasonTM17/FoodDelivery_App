import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export const VN_TZ = 'Asia/Ho_Chi_Minh'

export function now(): Date { return dayjs().tz(VN_TZ).toDate() }

export function today(): Date { return dayjs().tz(VN_TZ).startOf('day').toDate() }

export function daysAgo(days: number): Date { return dayjs().tz(VN_TZ).subtract(days, 'day').toDate() }

export function formatDate(date: Date, format = 'DD/MM/YYYY'): string { return dayjs(date).tz(VN_TZ).format(format) }

export function formatDateTime(date: Date): string { return dayjs(date).tz(VN_TZ).format('DD/MM/YYYY HH:mm') }

export function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}
