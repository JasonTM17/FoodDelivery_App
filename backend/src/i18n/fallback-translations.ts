/**
 * Vi fallback translations — used when I18nService is not injected
 * (unit test context) so the service still returns Vietnamese strings.
 * Keys mirror the JSON locale files in src/i18n/locales/vi/.
 * Template variables use {varName} syntax matching nestjs-i18n args.
 */
const FALLBACK: Record<string, string> = {
  // errors.json
  'errors.promotion_not_found': 'Mã khuyến mãi không tồn tại',
  'errors.promotion_invalid': 'Mã khuyến mãi không hợp lệ',
  'errors.promotion_expired': 'Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực',
  'errors.promotion_exhausted': 'Mã đã hết lượt dùng',
  'errors.promotion_min_order': 'Đơn tối thiểu phải đạt {amount}đ',
  'errors.promotion_wrong_restaurant': 'Mã không áp dụng cho nhà hàng này',
  'errors.promotion_first_order_only': 'Mã chỉ áp dụng cho đơn đầu tiên',
  'errors.promotion_max_per_user': 'Bạn đã dùng mã này tối đa {max} lần',
  'errors.promotion_device_blocked': 'Thiết bị đã sử dụng quá {max} mã khuyến mãi trong 1 giờ',
  'errors.promotion_fixed_cannot_stack': 'Mã giảm giá cố định không thể kết hợp với mã khác',
  'errors.promotion_one_per_type': 'Mỗi loại khuyến mãi chỉ được áp dụng 1 mã',
  'errors.order_cannot_cancel': 'Không thể huỷ đơn hàng ở trạng thái này',
  'errors.order_already_completed': 'Đơn hàng đã hoàn tất, không thể huỷ',
  'errors.order_processing_cannot_cancel':
    'Đơn hàng đang được xử lý bởi nhà hàng và không thể huỷ. Vui lòng liên hệ hỗ trợ.',
  'errors.order_driver_picked_up': 'Đơn hàng đã được tài xế nhận, không thể huỷ từ phía nhà hàng',
  'errors.order_cancel_reason_required': 'Nhà hàng phải cung cấp lý do huỷ đơn',
  'errors.order_invalid_role': 'Vai trò không hợp lệ',
  // notifications.json
  'notifications.order_update_title': 'Cập nhật đơn hàng',
  'notifications.order_update_body': 'Đơn {orderId}: {event}',
  'notifications.driver_delay_title': 'Cảnh báo trễ giao hàng',
  'notifications.driver_delay_body': 'Đơn {orderId} đang trễ {delayMinutes} phút',
}

/**
 * Resolves a translation key with optional arg interpolation ({key} → value).
 * Used as a fallback when I18nService is unavailable (e.g., unit tests).
 */
export function fallbackT(key: string, args?: Record<string, unknown>): string {
  let str = FALLBACK[key] ?? key
  if (args) {
    for (const [k, v] of Object.entries(args)) {
      str = str.replace(`{${k}}`, String(v))
    }
  }
  return str
}
