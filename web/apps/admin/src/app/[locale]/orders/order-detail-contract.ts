export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export function parseOrderItems(items: unknown): OrderItem[] | null {
  if (!Array.isArray(items)) {
    return null;
  }

  const parsed = items.map((item) => {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const row = item as Record<string, unknown>;
    if (
      typeof row.name !== 'string' ||
      row.name.trim().length === 0 ||
      typeof row.quantity !== 'number' ||
      !Number.isFinite(row.quantity) ||
      row.quantity <= 0 ||
      typeof row.price !== 'number' ||
      !Number.isFinite(row.price) ||
      row.price < 0
    ) {
      return null;
    }

    return {
      name: row.name,
      quantity: row.quantity,
      price: row.price,
    };
  });

  return parsed.every((item): item is OrderItem => item !== null) ? parsed : null;
}
