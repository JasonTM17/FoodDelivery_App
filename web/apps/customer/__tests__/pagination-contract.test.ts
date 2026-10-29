import { describe, expect, it } from 'vitest';
import { pageFromEnvelope } from '@/lib/api';

describe('Nest paginated HTTP response contract', () => {
  it('retains returned rows and pagination metadata outside the data array', () => {
    const rows = [{ id: 'restaurant-demo', name: 'Phở 24' }];
    expect(pageFromEnvelope({ data: rows, meta: { total: 25, page: 2, limit: 12 } }))
      .toEqual({ items: rows, total: 25, page: 2, limit: 12 });
  });
  it('preserves empty result pages without inventing catalog entries', () => {
    expect(pageFromEnvelope({ data: [], meta: { total: 0, page: 1, limit: 12 } }))
      .toEqual({ items: [], total: 0, page: 1, limit: 12 });
  });
});
