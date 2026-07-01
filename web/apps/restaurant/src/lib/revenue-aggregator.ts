import type { PaymentMethod, RevenueSource, RevenueSummary } from './types';

interface RevenueOrder {
  id: string;
  total: number;
  createdAt: string;
  source?: RevenueSource;
  paymentMethod?: PaymentMethod | 'mock_wallet';
  items: Array<{
    categoryId?: string;
    categoryName?: string;
    lineTotal?: number;
    unitPrice?: number;
    quantity?: number;
  }>;
}

interface RevenueAggregateInput {
  orders: RevenueOrder[];
  previousPeriod?: { orders: Array<{ total: number; createdAt: string }> };
  comparisonTotals?: {
    yesterday?: number;
    lastWeek?: number;
    lastMonth?: number;
  };
}

export function aggregateRevenueSummary(raw: RevenueAggregateInput): RevenueSummary {
  const { orders } = raw;
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  const orderCount = orders.length;

  const byDayMap = new Map<string, { vnd: number; orderCount: number }>();
  const categoryMap = new Map<string, { name: string; vnd: number }>();
  const hourMap = new Map<number, { vnd: number; orderCount: number }>();
  const sourceMap: Record<RevenueSource, number> = {
    organic: 0,
    promotion: 0,
    referral: 0,
    search: 0,
  };
  const paymentMap: Record<PaymentMethod, number> = {
    cash: 0,
    card: 0,
    wallet: 0,
    sepay: 0,
    vnpay: 0,
  };

  for (const order of orders) {
    const date = order.createdAt.slice(0, 10);
    const day = byDayMap.get(date) ?? { vnd: 0, orderCount: 0 };
    day.vnd += order.total;
    day.orderCount += 1;
    byDayMap.set(date, day);

    const hour = new Date(order.createdAt).getHours();
    const hourEntry = hourMap.get(hour) ?? { vnd: 0, orderCount: 0 };
    hourEntry.vnd += order.total;
    hourEntry.orderCount += 1;
    hourMap.set(hour, hourEntry);

    sourceMap[order.source ?? 'organic'] += order.total;
    const paymentMethod = order.paymentMethod === 'mock_wallet' ? 'wallet' : (order.paymentMethod ?? 'cash');
    paymentMap[paymentMethod] += order.total;

    for (const item of order.items) {
      const lineTotal = item.lineTotal ?? (
        item.unitPrice !== undefined && item.quantity !== undefined
          ? item.unitPrice * item.quantity
          : null
      );
      if (lineTotal === null) continue;
      const categoryId = item.categoryId ?? 'uncategorized';
      const category = categoryMap.get(categoryId) ?? {
        name: item.categoryName ?? 'Chưa phân loại',
        vnd: 0,
      };
      category.vnd += lineTotal;
      categoryMap.set(categoryId, category);
    }
  }

  const byDay = Array.from(byDayMap, ([date, value]) => ({ date, ...value }))
    .sort((left, right) => left.date.localeCompare(right.date));
  const attributedTotal = Array.from(categoryMap.values())
    .reduce((sum, category) => sum + category.vnd, 0);
  const byCategory = Array.from(categoryMap, ([categoryId, value]) => ({
    categoryId,
    name: value.name,
    vnd: Math.round(value.vnd),
    pct: attributedTotal > 0 ? Math.round((value.vnd / attributedTotal) * 100) : 0,
  })).sort((left, right) => right.vnd - left.vnd);
  const byHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    vnd: hourMap.get(hour)?.vnd ?? 0,
    orderCount: hourMap.get(hour)?.orderCount ?? 0,
  }));
  const bySource = toPercentageRows(sourceMap, total, 'source');
  const byPayment = toPercentageRows(paymentMap, total, 'method');

  const previousPeriodTotal = raw.previousPeriod?.orders
    .reduce((sum, order) => sum + order.total, 0);

  return {
    total: { vnd: total, orderCount },
    avg: {
      orderValue: orderCount > 0 ? Math.round(total / orderCount) : 0,
      perDay: byDay.length > 0 ? Math.round(total / byDay.length) : 0,
    },
    delta: {
      vsYesterday: percentageChange(total, raw.comparisonTotals?.yesterday),
      vsLastWeek: percentageChange(total, raw.comparisonTotals?.lastWeek ?? previousPeriodTotal),
      vsLastMonth: percentageChange(total, raw.comparisonTotals?.lastMonth),
    },
    byDay,
    byCategory,
    byHour,
    bySource,
    byPayment,
  };
}

function percentageChange(current: number, previous?: number): number | null {
  if (previous === undefined || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function toPercentageRows<
  T extends RevenueSource | PaymentMethod,
  K extends 'source' | 'method',
>(values: Record<T, number>, total: number, key: K): Array<Record<K, T> & { vnd: number; pct: number }> {
  return Object.entries(values).map(([name, amount]) => ({
    [key]: name as T,
    vnd: Math.round(amount as number),
    pct: total > 0 ? Math.round(((amount as number) / total) * 100) : 0,
  })) as Array<Record<K, T> & { vnd: number; pct: number }>;
}
