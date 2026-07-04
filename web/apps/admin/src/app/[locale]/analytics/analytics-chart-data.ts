export interface OrderStatusPoint {
  date: string
  pending: number
  confirmed: number
  delivering: number
  completed: number
  cancelled: number
}

export interface TopRestaurant {
  id: string
  name: string
  rating: number
  revenue: number
  orderCount: number
}

export interface RetentionCohort {
  date: string
  newCustomers: number
  retainedCustomers: number
  retentionRate: number
}

export interface AdminChartsData {
  orderStatus: OrderStatusPoint[]
  topRestaurants: TopRestaurant[]
  retention: RetentionCohort[]
}

export interface FunnelStep {
  key: string
  value: number
  percent: number
}

const localeTags: Record<string, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  vi: 'vi-VN',
}

function toSafeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function buildFunnel(rows: OrderStatusPoint[]): FunnelStep[] {
  const totals = rows.reduce(
    (sum, row) => ({
      pending: sum.pending + toSafeCount(row.pending),
      confirmed: sum.confirmed + toSafeCount(row.confirmed),
      delivering: sum.delivering + toSafeCount(row.delivering),
      completed: sum.completed + toSafeCount(row.completed),
      cancelled: sum.cancelled + toSafeCount(row.cancelled),
    }),
    { pending: 0, confirmed: 0, delivering: 0, completed: 0, cancelled: 0 },
  )
  const placed = totals.pending + totals.confirmed + totals.delivering + totals.completed + totals.cancelled
  const accepted = totals.confirmed + totals.delivering + totals.completed
  const delivery = totals.delivering + totals.completed

  return [
    { key: 'placed', value: placed, percent: placed > 0 ? 100 : 0 },
    { key: 'accepted', value: accepted, percent: placed > 0 ? (accepted / placed) * 100 : 0 },
    { key: 'delivery', value: delivery, percent: placed > 0 ? (delivery / placed) * 100 : 0 },
    { key: 'completed', value: totals.completed, percent: placed > 0 ? (totals.completed / placed) * 100 : 0 },
  ]
}

export function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(localeTags[locale] ?? 'vi-VN').format(value)
}

export function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(localeTags[locale] ?? 'vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(localeTags[locale] ?? 'vi-VN', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    style: 'percent',
  }).format(value / 100)
}
