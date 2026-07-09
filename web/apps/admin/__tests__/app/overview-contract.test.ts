import { describe, expect, it } from 'vitest';
import { parseOverviewHeatmap, parseOverviewKpis } from '@/app/[locale]/overview/overview-contract';

describe('overview contract guards', () => {
  it('accepts explicit empty KPI and heatmap arrays', () => {
    expect(parseOverviewKpis({ kpis: [] })).toEqual([]);
    expect(parseOverviewHeatmap({ heatmap: [] })).toEqual([]);
  });

  it('rejects malformed KPI envelopes instead of rendering a fake empty grid', () => {
    expect(() => parseOverviewKpis({})).toThrow('OVERVIEW_KPIS_CONTRACT_INVALID');
    expect(() => parseOverviewKpis({ kpis: [{ key: 'orders', label: 'Orders', value: 1 }] })).toThrow(
      'OVERVIEW_KPIS_CONTRACT_INVALID:0.sparkline',
    );
  });

  it('accepts valid overview KPI rows', () => {
    expect(
      parseOverviewKpis({
        kpis: [
          {
            key: 'orders',
            label: 'Orders',
            value: 12,
            formattedValue: '12',
            delta: 0.1,
            sparkline: [1, 2, 3],
            drillDownHref: '/orders',
          },
        ],
      }),
    ).toHaveLength(1);
  });

  it('rejects malformed heatmap envelopes instead of rendering a fake empty heatmap', () => {
    expect(() => parseOverviewHeatmap({})).toThrow('OVERVIEW_HEATMAP_CONTRACT_INVALID');
    expect(() => parseOverviewHeatmap({ heatmap: [{ day: 7, hour: 12, count: 1 }] })).toThrow(
      'OVERVIEW_HEATMAP_CONTRACT_INVALID:0.day',
    );
    expect(() => parseOverviewHeatmap({ heatmap: [{ day: 1, hour: 12, count: -1 }] })).toThrow(
      'OVERVIEW_HEATMAP_CONTRACT_INVALID:0.count',
    );
  });
});
