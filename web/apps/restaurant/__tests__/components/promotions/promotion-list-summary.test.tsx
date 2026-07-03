import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PromotionPerformancePanel } from '@/app/[locale]/promotions/promotion-list-summary';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      'performance.title': 'Performance overview',
      'performance.usage': 'Promotion uses',
      'performance.revenue': 'Promo revenue',
      'performance.conversion': 'Conversion rate',
      'performance.roi': 'ROI',
      'performance.unavailable': 'Unavailable',
      'performance.description': 'Based on confirmed promotion redemptions.',
      'performance.degradedDescription': 'Promotion analytics are temporarily unavailable.',
    };
    return messages[key] ?? key;
  },
}));

describe('PromotionPerformancePanel', () => {
  it('renders real aggregate analytics instead of unavailable placeholders', () => {
    render(
      <PromotionPerformancePanel
        activeCount={1}
        totalUsage={2}
        analytics={{
          usageCount: 2,
          revenueAttributed: 300_000,
          discountGiven: 30_000,
          redemptionRate: 4,
          roi: 900,
          usageTimeline: [],
        }}
      />,
    );

    expect(screen.getByText('Performance overview')).toBeVisible();
    expect(screen.getByText(/300,000/)).toBeVisible();
    expect(screen.getByText('4%')).toBeVisible();
    expect(screen.getByText('900%')).toBeVisible();
    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
  });
});
