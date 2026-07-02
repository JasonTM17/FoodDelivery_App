import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RestaurantRootLoading from '@/app/loading';
import NotFound from '@/app/not-found';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, string> = {
      'rootStates.loading.label': 'Loading restaurant dashboard',
      'rootStates.notFound.title': 'Page not found',
      'rootStates.notFound.description': 'The requested page does not exist.',
      'rootStates.notFound.backToDashboard': 'Back to overview',
    };
    return messages[`${namespace}.${key}`] ?? key;
  },
}));

describe('Restaurant root route states', () => {
  it('announces loading progress with localized copy', () => {
    render(<RestaurantRootLoading />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading restaurant dashboard');
  });

  it('returns users through locale-aware dashboard navigation', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to overview' })).toHaveAttribute('href', '/');
  });
});
