import type { I18nService } from 'nestjs-i18n'
import type { Locale } from '../types/locale.types'

export type { Locale }

export const ORDER_STATUS_LABELS: Record<string, string> = {
  created: 'Mới tạo',
  pending_payment: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  restaurant_pending: 'Chờ nhà hàng',
  restaurant_accepted: 'Nhà hàng đã nhận',
  preparing: 'Đang chuẩn bị',
  ready_for_pickup: 'Sẵn sàng giao',
  driver_assigned: 'Đã có tài xế',
  driver_arriving_restaurant: 'Tài xế đến nhà hàng',
  picked_up: 'Đã lấy hàng',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

export function getOrderStatusLabel(
  status: string,
  lang: Locale = 'vi',
  i18n?: I18nService,
): string {
  if (i18n) {
    try {
      return i18n.t(`constants.order_status.${status}`, { lang }) as string
    } catch {
      // fall through to static map
    }
  }
  return ORDER_STATUS_LABELS[status] ?? status
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  created: '#9CA3AF',
  pending_payment: '#F59E0B',
  paid: '#3B82F6',
  restaurant_pending: '#F59E0B',
  restaurant_accepted: '#3B82F6',
  preparing: '#F59E0B',
  ready_for_pickup: '#10B981',
  driver_assigned: '#3B82F6',
  driver_arriving_restaurant: '#3B82F6',
  picked_up: '#3B82F6',
  delivering: '#F59E0B',
  delivered: '#10B981',
  completed: '#10B981',
  cancelled: '#EF4444',
  refunded: '#9CA3AF',
}
