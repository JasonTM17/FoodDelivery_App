import { ConflictException } from '@nestjs/common'

export type OrderStatus =
  | 'created' | 'pending_payment' | 'paid' | 'restaurant_pending'
  | 'restaurant_accepted' | 'preparing' | 'ready_for_pickup'
  | 'driver_assigned' | 'driver_arriving_restaurant' | 'picked_up'
  | 'delivering' | 'delivered' | 'completed' | 'cancelled' | 'refunded'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'cancelled'],
  paid: ['restaurant_pending', 'cancelled', 'refunded'],
  restaurant_pending: ['restaurant_accepted', 'cancelled'],
  restaurant_accepted: ['preparing', 'driver_assigned', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['driver_assigned', 'cancelled'],
  driver_assigned: ['driver_arriving_restaurant', 'cancelled'],
  driver_arriving_restaurant: ['picked_up'],
  picked_up: ['delivering'],
  delivering: ['delivered'],
  delivered: ['completed'],
  cancelled: ['refunded'],
  refunded: [],
  completed: [],
}

const ROLE_TRANSITION_MAP: Record<string, Record<string, OrderStatus[]>> = {
  customer: {
    created: ['pending_payment', 'cancelled'],
    pending_payment: ['cancelled'],
    paid: ['cancelled'],
    restaurant_pending: ['cancelled'],
    delivered: ['completed'],
  },
  restaurant: {
    restaurant_pending: ['restaurant_accepted'],
    restaurant_accepted: ['preparing'],
    preparing: ['ready_for_pickup'],
    ready_for_pickup: ['cancelled'],
  },
  driver: {
    driver_assigned: ['driver_arriving_restaurant'],
    driver_arriving_restaurant: ['picked_up'],
    picked_up: ['delivering'],
    delivering: ['delivered'],
  },
  system: {
    created: ['pending_payment', 'cancelled'],
    pending_payment: ['paid', 'cancelled'],
    paid: ['restaurant_pending', 'cancelled'],
    restaurant_pending: ['cancelled'],
    restaurant_accepted: ['driver_assigned', 'cancelled'],
    preparing: ['cancelled'],
    ready_for_pickup: ['driver_assigned', 'cancelled'],
    delivered: ['completed'],
    cancelled: ['refunded'],
  },
}

export class OrderStateMachine {
  static canTransition(current: OrderStatus, next: OrderStatus): boolean {
    const allowed = VALID_TRANSITIONS[current]
    if (!allowed) return false
    return allowed.includes(next)
  }

  static canTransitionByRole(role: string, current: OrderStatus, next: OrderStatus): boolean {
    if (role === 'admin') return OrderStateMachine.canTransition(current, next)
    const roleTransitions = ROLE_TRANSITION_MAP[role]
    if (!roleTransitions) return false
    const allowed = roleTransitions[current]
    if (!allowed) return false
    return allowed.includes(next)
  }

  static validate(current: OrderStatus, next: OrderStatus, role: string): void {
    if (!OrderStateMachine.canTransition(current, next)) {
      throw new ConflictException(`Invalid transition: ${current} → ${next}`)
    }
    if (!OrderStateMachine.canTransitionByRole(role, current, next)) {
      throw new ConflictException(`Role '${role}' cannot transition from ${current} to ${next}`)
    }
  }
}
