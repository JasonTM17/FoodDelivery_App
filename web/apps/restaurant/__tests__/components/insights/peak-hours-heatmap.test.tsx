import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeakHoursHeatmap } from '@/components/insights/peak-hours-heatmap';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    if (key === 'title') return 'Peak hours';
    if (key === 'tableLabel') return 'Order heatmap by day and hour';
    if (key === 'hourShort') return `${values?.hour}h`;
    if (key === 'cellLabel') return `${values?.count} orders - ${values?.day} ${values?.hour}h`;
    if (key.startsWith('days.')) return key.slice(5);
    return key;
  },
}));

describe('PeakHoursHeatmap', () => {
  it('provides a focusable scroll region and a complete screen-reader table', () => {
    render(<PeakHoursHeatmap data={[{ day: 0, hour: 12, orderCount: 3 }]} />);

    const region = screen.getByRole('region', { name: 'Order heatmap by day and hour' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('table', { name: 'Order heatmap by day and hour' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '3 orders - mon 12h' })).toBeInTheDocument();
    expect(region.querySelector('div[aria-label*="orders"]')).toBeNull();
  });
});
