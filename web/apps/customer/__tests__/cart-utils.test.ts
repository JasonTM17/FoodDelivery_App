import { describe, expect, it } from 'vitest';
import {
  buildAddCartItemBody,
  cartItemCount,
  cartLineKey,
  cartSubtotal,
  cartTotal,
  computeUnitPrice,
  upsertCartLine,
  validateSelections,
  type CartLine,
} from '@/lib/cart-utils';
import type { MenuItem, SelectedOption } from '@/lib/types';

const SIZE_OPTION = {
  id: 'opt-size',
  name: 'Size',
  isRequired: true,
  isMultiple: false,
  values: [
    { id: 'v-small', value: 'Small', priceModifier: 0 },
    { id: 'v-large', value: 'Large', priceModifier: 15000 },
  ],
};

const TOPPING_OPTION = {
  id: 'opt-top',
  name: 'Toppings',
  isRequired: false,
  isMultiple: true,
  values: [
    { id: 'v-cheese', value: 'Cheese', priceModifier: 8000 },
    { id: 'v-egg', value: 'Egg', priceModifier: 5000 },
  ],
};

const ITEM: Pick<MenuItem, 'options'> = { options: [SIZE_OPTION, TOPPING_OPTION] };

function sel(optionId: string, valueId: string, priceModifier = 0): SelectedOption {
  return { optionId, valueId, optionName: '', valueName: '', priceModifier };
}

describe('computeUnitPrice', () => {
  it('returns base price with no selections', () => {
    expect(computeUnitPrice(50000, [])).toBe(50000);
  });

  it('adds option price modifiers like the backend', () => {
    const unit = computeUnitPrice(50000, [
      sel('opt-size', 'v-large', 15000),
      sel('opt-top', 'v-cheese', 8000),
      sel('opt-top', 'v-egg', 5000),
    ]);
    expect(unit).toBe(78000);
  });
});

describe('validateSelections', () => {
  it('rejects missing required options', () => {
    expect(validateSelections(ITEM, [])).toBe('CART_OPTION_REQUIRED');
  });

  it('accepts a valid required + optional selection', () => {
    expect(
      validateSelections(ITEM, [sel('opt-size', 'v-small'), sel('opt-top', 'v-egg', 5000)]),
    ).toBeNull();
  });

  it('rejects unknown option ids', () => {
    expect(
      validateSelections(ITEM, [sel('opt-size', 'v-small'), sel('bogus', 'x')]),
    ).toBe('CART_OPTION_INVALID');
  });

  it('rejects value ids that do not belong to the option', () => {
    expect(validateSelections(ITEM, [sel('opt-size', 'v-cheese')])).toBe('CART_OPTION_INVALID');
  });
});

describe('cartLineKey / upsertCartLine', () => {
  const line = (quantity: number, options: SelectedOption[] = []): CartLine => ({
    key: cartLineKey('item-1', options),
    menuItemId: 'item-1',
    name: 'Pho',
    quantity,
    unitPrice: 50000,
    selectedOptions: options,
  });

  it('produces the same key regardless of option order', () => {
    const a = [sel('opt-a', 'v1'), sel('opt-b', 'v2')];
    const b = [sel('opt-b', 'v2'), sel('opt-a', 'v1')];
    expect(cartLineKey('item-1', a)).toBe(cartLineKey('item-1', b));
  });

  it('produces different keys for different options', () => {
    expect(cartLineKey('item-1', [sel('opt-a', 'v1')])).not.toBe(
      cartLineKey('item-1', [sel('opt-a', 'v2')]),
    );
  });

  it('merges same-key lines by summing quantity', () => {
    const items = upsertCartLine([line(1)], line(2));
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('keeps distinct option sets as separate lines', () => {
    const items = upsertCartLine(
      [line(1, [sel('opt-a', 'v1')])],
      line(1, [sel('opt-a', 'v2')]),
    );
    expect(items).toHaveLength(2);
  });
});

describe('totals', () => {
  it('computes subtotal and item count', () => {
    const items: CartLine[] = [
      { key: 'a', menuItemId: 'a', name: 'A', quantity: 2, unitPrice: 30000, selectedOptions: [] },
      { key: 'b', menuItemId: 'b', name: 'B', quantity: 1, unitPrice: 20000, selectedOptions: [] },
    ];
    expect(cartSubtotal(items)).toBe(80000);
    expect(cartItemCount(items)).toBe(3);
  });

  it('applies delivery fee and discount to the total', () => {
    const items: CartLine[] = [
      { key: 'a', menuItemId: 'a', name: 'A', quantity: 1, unitPrice: 50000, selectedOptions: [] },
    ];
    expect(cartTotal(items, 15000, 10000)).toBe(55000);
    expect(cartTotal(items, null, undefined)).toBe(50000);
  });
});

describe('buildAddCartItemBody', () => {
  it('emits the backend cart contract', () => {
    const body = buildAddCartItemBody('rest-1', {
      menuItemId: 'item-9',
      quantity: 2,
      selectedOptions: [
        { optionId: 'o1', valueId: 'v1', optionName: 'Size', valueName: 'L', priceModifier: 5 },
      ],
      notes: '  no spice  ',
    });
    expect(body).toEqual({
      restaurantId: 'rest-1',
      menuItemId: 'item-9',
      quantity: 2,
      selectedOptions: [{ optionId: 'o1', valueId: 'v1' }],
      notes: 'no spice',
    });
  });

  it('omits optional fields when empty', () => {
    const body = buildAddCartItemBody('rest-1', {
      menuItemId: 'item-9',
      quantity: 1,
      selectedOptions: [],
      notes: '   ',
    });
    expect(body).toEqual({ restaurantId: 'rest-1', menuItemId: 'item-9', quantity: 1 });
  });
});
