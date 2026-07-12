import { ForbiddenException, Injectable } from '@nestjs/common'
import { I18nService, I18nContext } from 'nestjs-i18n'
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
  constructor(private readonly i18n: I18nService) {}

  private t(key: string): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang ?? 'vi' })
  }

  assertCanCancel(role: string, currentStatus: OrderStatus, reason?: string): void {
    const policy = this.evaluate(role, currentStatus, reason)
    if (!policy.allowed) {
      throw new ForbiddenException(policy.reason ?? this.t('errors.order_cannot_cancel'))
    }
  }

  evaluate(role: string, currentStatus: OrderStatus, reason?: string): CancellationPolicy {
    if (TERMINAL_STATES.includes(currentStatus)) {
      return { allowed: false, reason: this.t('errors.order_already_completed') }
    }

    if (role === 'admin') {
      return { allowed: true }
    }

    if (role === 'customer') {
      if (!CUSTOMER_CANCEL_STATES.includes(currentStatus)) {
        return { allowed: false, reason: this.t('errors.order_processing_cannot_cancel') }
      }
      return { allowed: true }
    }

    if (role === 'restaurant') {
      if (!RESTAURANT_CANCEL_STATES.includes(currentStatus)) {
        return { allowed: false, reason: this.t('errors.order_driver_picked_up') }
      }
      if (!reason || reason.trim().length === 0) {
        return { allowed: false, reason: this.t('errors.order_cancel_reason_required') }
      }
      return { allowed: true }
    }

    return { allowed: false, reason: this.t('errors.order_invalid_role') }
  }
}
