import type { KpiData } from '@/components/kpi/kpi-card';

export interface OverviewHeatmapCell {
  day: number;
  hour: number;
  count: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`OVERVIEW_CONTRACT_INVALID:${field}`);
  }
  return value;
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`OVERVIEW_CONTRACT_INVALID:${field}`);
  }
  return value;
}

export function parseOverviewKpis(value: unknown): KpiData[] {
  if (!isRecord(value) || !Array.isArray(value.kpis)) {
    throw new Error('OVERVIEW_KPIS_CONTRACT_INVALID');
  }

  return value.kpis.map((item, index): KpiData => {
    if (!isRecord(item)) {
      throw new Error(`OVERVIEW_KPIS_CONTRACT_INVALID:${index}`);
    }

    if (!Array.isArray(item.sparkline) || item.sparkline.some((point) => typeof point !== 'number' || !Number.isFinite(point))) {
      throw new Error(`OVERVIEW_KPIS_CONTRACT_INVALID:${index}.sparkline`);
    }

    return {
      key: assertString(item.key, `${index}.key`),
      label: assertString(item.label, `${index}.label`),
      value: assertFiniteNumber(item.value, `${index}.value`),
      formattedValue: assertString(item.formattedValue, `${index}.formattedValue`),
      delta: assertFiniteNumber(item.delta, `${index}.delta`),
      sparkline: item.sparkline,
      drillDownHref: assertString(item.drillDownHref, `${index}.drillDownHref`),
    };
  });
}

export function parseOverviewHeatmap(value: unknown): OverviewHeatmapCell[] {
  if (!isRecord(value) || !Array.isArray(value.heatmap)) {
    throw new Error('OVERVIEW_HEATMAP_CONTRACT_INVALID');
  }

  return value.heatmap.map((item, index): OverviewHeatmapCell => {
    if (!isRecord(item)) {
      throw new Error(`OVERVIEW_HEATMAP_CONTRACT_INVALID:${index}`);
    }

    const day = assertFiniteNumber(item.day, `${index}.day`);
    const hour = assertFiniteNumber(item.hour, `${index}.hour`);
    const count = assertFiniteNumber(item.count, `${index}.count`);

    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new Error(`OVERVIEW_HEATMAP_CONTRACT_INVALID:${index}.day`);
    }

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new Error(`OVERVIEW_HEATMAP_CONTRACT_INVALID:${index}.hour`);
    }

    if (count < 0) {
      throw new Error(`OVERVIEW_HEATMAP_CONTRACT_INVALID:${index}.count`);
    }

    return { day, hour, count };
  });
}
