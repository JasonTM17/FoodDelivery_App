import { describe, expect, it } from 'vitest';
import { decodePolyline, latLngBoundsFrom } from '@/lib/polyline';

describe('decodePolyline', () => {
  it('decodes the canonical Google example', () => {
    // Encodes (38.5,-120.2) (40.7,-120.95) (43.252,-126.453)
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(points).toHaveLength(3);
    expect(points[0].lat).toBeCloseTo(38.5, 5);
    expect(points[0].lng).toBeCloseTo(-120.2, 5);
    expect(points[1].lat).toBeCloseTo(40.7, 5);
    expect(points[2].lng).toBeCloseTo(-126.453, 4);
  });

  it('returns an empty list for malformed input instead of fabricating points', () => {
    expect(decodePolyline('')).toEqual([]);
    expect(decodePolyline('!!!not-a-polyline')).toEqual([]);
  });
});

describe('latLngBoundsFrom', () => {
  it('computes lng/lat bounds', () => {
    const bounds = latLngBoundsFrom([
      [105.8, 21.0],
      [106.0, 20.5],
      [105.9, 21.3],
    ]);
    expect(bounds).toEqual([
      [105.8, 20.5],
      [106.0, 21.3],
    ]);
  });

  it('returns null for empty or non-finite input', () => {
    expect(latLngBoundsFrom([])).toBeNull();
    expect(latLngBoundsFrom([[NaN, NaN]])).toBeNull();
  });
});
