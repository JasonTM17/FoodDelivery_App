import { ForbiddenException, Injectable } from '@nestjs/common'
import { OrderStatus } from './order-state-machine'

interface CancellationPolicy {
  allowed: boolean
  reason?: string
}

const CUSTOMER_CANCEL_STATES: OrderStatus[] = [
  'created', 'pending_payment', 'paid', 'restaurant_pending',
]

const RESTAURANT_CANCEL_STATES: OrderStatus[] = [
  'created', 'pending_payment', 'paid', 'restaurant_pending',
  'restaurant_accepted', 'preparing', 'ready_for_pickup',
]

const TERMINAL_STATES: OrderStatus[] = ['completed', 'refunded']

@Injectable()
export class CancellationService {
  assertCanCancel(role: string, currentStatus: OrderStatus, reason?: string): void {
    const policy = this.evaluate(role, currentStatus, reason)
    if (!policy.allowed) {
      throw new ForbiddenException(policy.reason ?? 'Không thể huỷ đơn hàng ở trạng thái này')
    }
  }

  evaluate(role: string, currentStatus: OrderStatus, reason?: string): CancellationPolicy {
    if (TERMINAL_STATES.includes(currentStatus)) {
      return { allowed: false, reason: 'Đơn hàng đã hoàn tất, không thể huỷ' }
    }

    if (role === 'admin') {
      return { allowed: true }
    }

    if (role === 'customer') {
      if (!CUSTOMER_CANCEL_STATES.includes(currentStatus)) {
        return {
          allowed: false,
          reason:
            'Đơn hàng đang được xử lý bởi nhà hàng và không thể huỷ. Vui lòng liên hệ hỗ trợ.',
        }
      }
      return { allowed: true }
    }

    if (role === 'restaurant') {
      if (!RESTAURANT_CANCEL_STATES.includes(currentStatus)) {
        return {
          allowed: false,
          reason: 'Đơn hàng đã được tài xế nhận, không thể huỷ từ phía nhà hàng',
        }
      }
      if (!reason || reason.trim().length === 0) {
        return { allowed: false, reason: 'Nhà hàng phải cung cấp lý do huỷ đơn' }
      }
      return { allowed: true }
    }

    return { allowed: false, reason: 'Vai trò không hợp lệ' }
  }
}
