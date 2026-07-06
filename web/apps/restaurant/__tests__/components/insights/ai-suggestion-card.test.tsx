import { render, screen } from '@testing-library/react';
import type { AiSuggestion } from '@/lib/types';
import { describe, expect, it, vi } from 'vitest';
import { AiSuggestionCard } from '@/components/insights/ai-suggestion-card';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      'types.menu_mix': 'Menu',
      'catalog.menuAvailability.title': 'Review hidden menu items',
      'catalog.menuAvailability.description': '{count} menu items are currently unavailable.',
      'catalog.menuAvailability.impact': 'Reduce failed orders',
    };

    return interpolate(messages[key] ?? key, values);
  },
}));

describe('AiSuggestionCard', () => {
  it('renders translated recommendation keys with backend params', () => {
    render(
      <AiSuggestionCard
        suggestion={{
          id: 'menu-availability',
          type: 'menu_mix',
          titleKey: 'catalog.menuAvailability.title',
          descriptionKey: 'catalog.menuAvailability.description',
          predictedImpactKey: 'catalog.menuAvailability.impact',
          params: { count: 2 },
          actionable: false,
        }}
      />,
    );

    expect(screen.getByText('Menu')).toBeVisible();
    expect(screen.getByText('Review hidden menu items')).toBeVisible();
    expect(screen.getByText('2 menu items are currently unavailable.')).toBeVisible();
    expect(screen.getByText('Reduce failed orders')).toBeVisible();
  });

  it('ignores legacy text fields when a payload carries extra stale properties', () => {
    render(
      <AiSuggestionCard
        suggestion={{
          id: 'legacy',
          type: 'menu_mix',
          title: 'Legacy title',
          description: 'Legacy description',
          predictedImpact: 'Legacy impact',
          titleKey: 'catalog.menuAvailability.title',
          descriptionKey: 'catalog.menuAvailability.description',
          predictedImpactKey: 'catalog.menuAvailability.impact',
          params: { count: 1 },
          actionable: false,
        } as unknown as AiSuggestion}
      />,
    );

    expect(screen.queryByText('Legacy title')).not.toBeInTheDocument();
    expect(screen.queryByText('Legacy description')).not.toBeInTheDocument();
    expect(screen.queryByText('Legacy impact')).not.toBeInTheDocument();
    expect(screen.getByText('Review hidden menu items')).toBeVisible();
  });
});

function interpolate(message: string, values: Record<string, string | number> = {}) {
  return message.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
