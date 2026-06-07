import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { Locale } from '../types/locale.types'

dayjs.extend(utc)
dayjs.extend(timezone)

export const VN_TZ = 'Asia/Ho_Chi_Minh'

export function now(): Date { return dayjs().tz(VN_TZ).toDate() }

export function today(): Date { return dayjs().tz(VN_TZ).startOf('day').toDate() }

export function daysAgo(days: number): Date { return dayjs().tz(VN_TZ).subtract(days, 'day').toDate() }

export function formatDate(date: Date, format = 'DD/MM/YYYY'): string { return dayjs(date).tz(VN_TZ).format(format) }

export function formatDateTime(date: Date): string { return dayjs(date).tz(VN_TZ).format('DD/MM/YYYY HH:mm') }

const REL_TIME: Record<Locale, { now: string; min: (n: number) => string; hr: (n: number) => string; day: (n: number) => string }> = {
  vi: {
    now: 'vừa xong',
    min: (n) => `${n} phút trước`,
    hr: (n) => `${n} giờ trước`,
    day: (n) => `${n} ngày trước`,
  },
  en: {
    now: 'just now',
    min: (n) => `${n} minute${n === 1 ? '' : 's'} ago`,
    hr: (n) => `${n} hour${n === 1 ? '' : 's'} ago`,
    day: (n) => `${n} day${n === 1 ? '' : 's'} ago`,
  },
  ja: {
    now: 'たった今',
    min: (n) => `${n}分前`,
    hr: (n) => `${n}時間前`,
    day: (n) => `${n}日前`,
  },
}

export function timeSince(date: Date, lang: Locale = 'vi'): string {
  const t = REL_TIME[lang] ?? REL_TIME.vi
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return t.now
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t.min(minutes)
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t.hr(hours)
  const days = Math.floor(hours / 24)
  return t.day(days)
}
