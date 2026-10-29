import { describe, expect, it } from 'vitest';
import {
  CUSTOMER_CANCELLABLE_STATUSES,
  isActiveOrder,
  isLiveTrackingStatus,
  isTrackingRelevant,
  orderProgressStep,
  orderStatusMeta,
  PROGRESS_STEPS,
  REVIEWABLE_STATUSES,
} from '@/lib/order-status';

describe('orderStatusMeta', () => {
  it('labels known statuses', () => {
    expect(orderStatusMeta('delivering')).toEqual({ label: 'On the way', tone: 'info' });
    expect(orderStatusMeta('delivered').tone).toBe('success');
    expect(orderStatusMeta('cancelled').tone).toBe('danger');
  });

  it('humanizes unknown statuses without crashing', () => {
    expect(orderStatusMeta('some_new_state').label).toBe('some new state');
    expect(orderStatusMeta('some_new_state').tone).toBe('neutral');
  });
});

describe('orderProgressStep', () => {
  it('maps statuses onto the 5-step progress rail', () => {
    expect(PROGRESS_STEPS).toHaveLength(5);
    expect(orderProgressStep('created')).toBe(0);
    expect(orderProgressStep('restaurant_accepted')).toBe(1);
    expect(orderProgressStep('preparing')).toBe(2);
    expect(orderProgressStep('picked_up')).toBe(3);
    expect(orderProgressStep('delivered')).toBe(4);
  });
});

describe('status sets', () => {
  it('treats only pre-acceptance states as cancellable by the customer', () => {
    for (const s of ['created', 'pending_payment', 'paid', 'restaurant_pending']) {
      expect(CUSTOMER_CANCELLABLE_STATUSES.has(s), s).toBe(true);
    }
    for (const s of ['restaurant_accepted', 'preparing', 'picked_up', 'delivered', 'cancelled']) {
      expect(CUSTOMER_CANCELLABLE_STATUSES.has(s), s).toBe(false);
    }
  });

  it('keeps active, live-tracking, and reviewable sets consistent', () => {
    expect(isActiveOrder('delivering')).toBe(true);
    expect(isActiveOrder('delivered')).toBe(false);
    expect(isLiveTrackingStatus('picked_up')).toBe(true);
    expect(isLiveTrackingStatus('preparing')).toBe(false);
    expect(isTrackingRelevant('preparing')).toBe(true);
    expect(REVIEWABLE_STATUSES.has('completed')).toBe(true);
    expect(REVIEWABLE_STATUSES.has('cancelled')).toBe(false);
  });
});
