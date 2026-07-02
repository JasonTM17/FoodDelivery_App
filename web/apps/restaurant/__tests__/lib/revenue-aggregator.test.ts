import { describe, expect, it } from 'vitest';
import { aggregateRevenueSummary } from '@/lib/revenue-aggregator';

describe('aggregateRevenueSummary', () => {
  it('attributes category revenue from order-item value instead of splitting order totals', () => {
    const result = aggregateRevenueSummary({
      orders: [{
        id: 'order-1',
        total: 150_000,
        createdAt: '2026-07-01T08:00:00.000Z',
        items: [
          { categoryId: 'food', categoryName: 'Food', unitPrice: 50_000, quantity: 2 },
          { categoryId: 'drink', categoryName: 'Drink', lineTotal: 20_000 },
        ],
      }],
    });

    expect(result.byCategory).toEqual([
      { categoryId: 'food', name: 'Food', vnd: 100_000, pct: 83 },
      { categoryId: 'drink', name: 'Drink', vnd: 20_000, pct: 17 },
    ]);
  });

  it('calculates totals, averages, and comparison deltas', () => {
    const result = aggregateRevenueSummary({
      orders: [
        { id: '1', total: 100_000, createdAt: '2026-07-01T08:00:00.000Z', items: [] },
        { id: '2', total: 200_000, createdAt: '2026-07-02T08:00:00.000Z', items: [] },
      ],
      comparisonTotals: { yesterday: 200_000, lastWeek: 600_000 },
    });

    expect(result.total).toEqual({ vnd: 300_000, orderCount: 2 });
    expect(result.avg).toEqual({ orderValue: 150_000, perDay: 150_000 });
    expect(result.delta.vsYesterday).toBe(50);
    expect(result.delta.vsLastWeek).toBe(-50);
    expect(result.delta.vsLastMonth).toBeNull();
  });

  it('groups sources and payments by actual order totals', () => {
    const result = aggregateRevenueSummary({
      orders: [
        {
          id: '1', total: 75_000, createdAt: '2026-07-01T08:00:00.000Z',
          source: 'promotion', paymentMethod: 'sepay', items: [],
        },
        {
          id: '2', total: 25_000, createdAt: '2026-07-01T09:00:00.000Z',
          source: 'organic', paymentMethod: 'cash', items: [],
        },
      ],
    });

    expect(result.bySource.find(row => row.source === 'promotion')).toMatchObject({ vnd: 75_000, pct: 75 });
    expect(result.byPayment.find(row => row.method === 'cash')).toMatchObject({ vnd: 25_000, pct: 25 });
  });

  it('returns neutral values for an empty period', () => {
    const result = aggregateRevenueSummary({ orders: [] });

    expect(result.total).toEqual({ vnd: 0, orderCount: 0 });
    expect(result.avg).toEqual({ orderValue: 0, perDay: 0 });
    expect(result.byHour).toHaveLength(24);
    expect(result.delta.vsYesterday).toBeNull();
  });
});
