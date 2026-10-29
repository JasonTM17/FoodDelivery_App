/**
 * Mirrors the backend OrderStateMachine driver role transitions:
 *   driver_assigned → driver_arriving_restaurant → picked_up → delivering → delivered
 */
export type DriverLocale = 'vi' | 'en' | 'ja';

export const DRIVER_NEXT_STATUS: Record<string, string> = {
  driver_assigned: 'driver_arriving_restaurant',
  driver_arriving_restaurant: 'picked_up',
  picked_up: 'delivering',
  delivering: 'delivered',
};

export const DRIVER_NEXT_ACTION_LABEL: Record<string, string> = {
  driver_assigned: 'Head to restaurant',
  driver_arriving_restaurant: 'Confirm pickup',
  picked_up: 'Start delivery',
  delivering: 'Confirm delivery',
};

export const DRIVER_NEXT_ACTION_LABEL_VI: Record<string, string> = {
  driver_assigned: 'Đến nhà hàng lấy món',
  driver_arriving_restaurant: 'Xác nhận đã lấy món',
  picked_up: 'Bắt đầu giao đến khách',
  delivering: 'Xác nhận đã giao hàng',
};

export const DRIVER_NEXT_ACTION_LABEL_JA: Record<string, string> = {
  driver_assigned: 'レストランへ向かう',
  driver_arriving_restaurant: '料理の受け取りを確認',
  picked_up: '配達を開始する',
  delivering: '配達完了を確認',
};

export const DRIVER_STATUS_LABELS: Record<string, string> = {
  driver_assigned: 'Assigned',
  driver_arriving_restaurant: 'Heading to restaurant',
  picked_up: 'Picked up',
  delivering: 'Delivering',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const DRIVER_STATUS_LABELS_VI: Record<string, string> = {
  driver_assigned: 'Đã nhận chuyến',
  driver_arriving_restaurant: 'Đang đến quán',
  picked_up: 'Đã lấy món',
  delivering: 'Đang giao hàng',
  delivered: 'Đã giao thành công',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

export const DRIVER_STATUS_LABELS_JA: Record<string, string> = {
  driver_assigned: '受託済み',
  driver_arriving_restaurant: 'レストランへ移動中',
  picked_up: '料理受取済み',
  delivering: '配達中',
  delivered: '配達完了',
  completed: '完了',
  cancelled: 'キャンセル',
  refunded: '返金済み',
};

export function nextDriverStatus(status: string): string | null {
  return DRIVER_NEXT_STATUS[status] ?? null;
}

export function nextDriverActionLabel(status: string, locale: DriverLocale = 'en'): string | null {
  if (locale === 'vi') return DRIVER_NEXT_ACTION_LABEL_VI[status] ?? DRIVER_NEXT_ACTION_LABEL[status] ?? null;
  if (locale === 'ja') return DRIVER_NEXT_ACTION_LABEL_JA[status] ?? DRIVER_NEXT_ACTION_LABEL[status] ?? null;
  return DRIVER_NEXT_ACTION_LABEL[status] ?? null;
}

export function driverStatusLabel(status: string, locale: DriverLocale = 'en'): string {
  if (locale === 'vi') return DRIVER_STATUS_LABELS_VI[status] ?? DRIVER_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
  if (locale === 'ja') return DRIVER_STATUS_LABELS_JA[status] ?? DRIVER_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
  return DRIVER_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function isActiveDriverStatus(status: string): boolean {
  return status in DRIVER_NEXT_STATUS;
}
