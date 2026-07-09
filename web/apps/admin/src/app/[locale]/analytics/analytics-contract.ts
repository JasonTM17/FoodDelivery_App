import type { AdminChartsData, OrderStatusPoint, RetentionCohort, TopRestaurant } from './analytics-chart-data'

export interface ApiKpiItem {
  key: string
  label: string
  value: number
  formattedValue: string
  delta: number
  sparkline: number[]
  drillDownHref: string
}

export interface ApiKpiResponse {
  kpis: ApiKpiItem[]
}

export function parseAnalyticsKpis(value: unknown): ApiKpiResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ADMIN_ANALYTICS_KPI_CONTRACT')
  }
  const kpis = (value as { kpis?: unknown }).kpis
  if (!Array.isArray(kpis) || !kpis.every(isApiKpiItem)) {
    throw new Error('ADMIN_ANALYTICS_KPI_CONTRACT')
  }
  return { kpis }
}

export function parseAnalyticsCharts(value: unknown): AdminChartsData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ADMIN_ANALYTICS_CHARTS_CONTRACT')
  }
  const data = value as Partial<Record<keyof AdminChartsData, unknown>>
  if (
    !Array.isArray(data.orderStatus) ||
    !data.orderStatus.every(isOrderStatusPoint) ||
    !Array.isArray(data.topRestaurants) ||
    !data.topRestaurants.every(isTopRestaurant) ||
    !Array.isArray(data.retention) ||
    !data.retention.every(isRetentionCohort)
  ) {
    throw new Error('ADMIN_ANALYTICS_CHARTS_CONTRACT')
  }
  return {
    orderStatus: data.orderStatus,
    topRestaurants: data.topRestaurants,
    retention: data.retention,
  }
}

function isApiKpiItem(value: unknown): value is ApiKpiItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const item = value as Partial<ApiKpiItem>
  return typeof item.key === 'string' &&
    typeof item.label === 'string' &&
    typeof item.value === 'number' &&
    Number.isFinite(item.value) &&
    typeof item.formattedValue === 'string' &&
    typeof item.delta === 'number' &&
    Number.isFinite(item.delta) &&
    Array.isArray(item.sparkline) &&
    item.sparkline.every(point => typeof point === 'number' && Number.isFinite(point)) &&
    typeof item.drillDownHref === 'string'
}

function isOrderStatusPoint(value: unknown): value is OrderStatusPoint {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const point = value as Partial<OrderStatusPoint>
  return typeof point.date === 'string' &&
    isFiniteNumber(point.pending) &&
    isFiniteNumber(point.confirmed) &&
    isFiniteNumber(point.delivering) &&
    isFiniteNumber(point.completed) &&
    isFiniteNumber(point.cancelled)
}

function isTopRestaurant(value: unknown): value is TopRestaurant {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const restaurant = value as Partial<TopRestaurant>
  return typeof restaurant.id === 'string' &&
    typeof restaurant.name === 'string' &&
    isFiniteNumber(restaurant.rating) &&
    isFiniteNumber(restaurant.revenue) &&
    isFiniteNumber(restaurant.orderCount)
}

function isRetentionCohort(value: unknown): value is RetentionCohort {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const cohort = value as Partial<RetentionCohort>
  return typeof cohort.date === 'string' &&
    isFiniteNumber(cohort.newCustomers) &&
    isFiniteNumber(cohort.retainedCustomers) &&
    isFiniteNumber(cohort.retentionRate)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
