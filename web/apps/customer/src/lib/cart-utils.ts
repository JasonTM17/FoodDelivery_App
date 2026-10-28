import type { MenuItem, SelectedOption } from '@/lib/types';

export interface CartLine {
  /** Stable identity for merging: menuItemId + sorted option signature. */
  key: string;
  menuItemId: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: SelectedOption[];
  notes?: string;
  /** Server cart item id once synced; local-only items have none. */
  serverId?: string;
}

export interface CartStateShape {
  restaurantId: string | null;
  restaurantName: string;
  items: CartLine[];
  promoCode?: string;
  discount: number;
}

export const EMPTY_CART: CartStateShape = {
  restaurantId: null,
  restaurantName: '',
  items: [],
  discount: 0,
};

export function optionsSignature(selections: Array<{ optionId: string; valueId: string }>): string {
  return selections
    .map((s) => `${s.optionId}=${s.valueId}`)
    .sort()
    .join('|');
}

export function cartLineKey(menuItemId: string, selections: SelectedOption[]): string {
  return `${menuItemId}::${optionsSignature(selections)}`;
}

/** Mirrors the backend unit price: basePrice + Σ priceModifier. */
export function computeUnitPrice(basePrice: number, selections: SelectedOption[]): number {
  return basePrice + selections.reduce((sum, s) => sum + (Number(s.priceModifier) || 0), 0);
}

/**
 * Validates option selections against the menu contract. Returns an error
 * code string or null when the selection is addable.
 */
export function validateSelections(
  item: Pick<MenuItem, 'options'>,
  selections: SelectedOption[],
): 'CART_OPTION_REQUIRED' | 'CART_OPTION_INVALID' | null {
  const optionById = new Map(item.options.map((o) => [o.id, o]));
  const chosenOptionIds = new Set<string>();

  for (const sel of selections) {
    const option = optionById.get(sel.optionId);
    if (!option) return 'CART_OPTION_INVALID';
    if (!option.values.some((v) => v.id === sel.valueId)) return 'CART_OPTION_INVALID';
    chosenOptionIds.add(sel.optionId);
  }

  for (const option of item.options) {
    if (option.isRequired && !chosenOptionIds.has(option.id)) return 'CART_OPTION_REQUIRED';
  }

  return null;
}

export function cartSubtotal(items: CartLine[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function cartItemCount(items: CartLine[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(
  items: CartLine[],
  deliveryFee: number | null | undefined,
  discount: number | null | undefined,
): number {
  return cartSubtotal(items) + (deliveryFee ?? 0) - (discount ?? 0);
}

/** Adds or merges a line. Server merges identical items by quantity too. */
export function upsertCartLine(items: CartLine[], line: CartLine): CartLine[] {
  const index = items.findIndex((item) => item.key === line.key);
  if (index < 0) return [...items, line];
  const next = [...items];
  next[index] = { ...next[index], quantity: next[index].quantity + line.quantity };
  return next;
}

export function buildAddCartItemBody(
  restaurantId: string,
  line: Pick<CartLine, 'menuItemId' | 'quantity' | 'selectedOptions' | 'notes'>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    restaurantId,
    menuItemId: line.menuItemId,
    quantity: line.quantity,
  };
  if (line.selectedOptions.length > 0) {
    body.selectedOptions = line.selectedOptions.map((o) => ({
      optionId: o.optionId,
      valueId: o.valueId,
    }));
  }
  const notes = line.notes?.trim();
  if (notes) body.notes = notes;
  return body;
}
