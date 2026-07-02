import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouteErrorState } from '@/components/shared/route-error-state';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (
    key: string,
    values?: Record<string, string | number>,
  ) => {
    const messages: Record<string, string> = {
      'routeErrors.revenue.title': 'Unable to load revenue',
      'routeErrors.revenue.description': 'Revenue data is temporarily unavailable.',
      'routeErrors.reference': 'Reference: {reference}',
      'routeErrors.retry': 'Retry',
    };
    return interpolate(messages[`${namespace}.${key}`] ?? key, values);
  },
}));

describe('RouteErrorState', () => {
  it('shows safe localized copy and a digest without exposing the raw error', () => {
    const reset = vi.fn();
    const error = Object.assign(
      new Error('INTERNAL_DATABASE_CREDENTIAL_DO_NOT_RENDER'),
      { digest: 'ERR-4F12' },
    );

    render(<RouteErrorState feature="revenue" error={error} reset={reset} />);

    expect(screen.getByRole('alert')).toHaveAccessibleName('Unable to load revenue');
    expect(screen.getByText('Revenue data is temporarily unavailable.')).toBeVisible();
    expect(screen.getByText('Reference: ERR-4F12')).toBeVisible();
    expect(screen.queryByText(/INTERNAL_DATABASE_CREDENTIAL_DO_NOT_RENDER/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});

function interpolate(template: string, values?: Record<string, string | number>): string {
  return Object.entries(values ?? {}).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}
