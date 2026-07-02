import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudiencePreview } from '@/components/shared/audience-preview';
import { useTargetingPreview } from '@/hooks/use-targeting-preview';

vi.mock('@/hooks/use-targeting-preview', () => ({ useTargetingPreview: vi.fn() }));
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: { count?: string }) => {
    const messages: Record<string, string> = {
      loading: 'Calculating audience reach',
      error: 'Audience reach is temporarily unavailable.',
      retry: 'Retry',
      empty: 'No eligible customers in this audience.',
      'audiences.all': 'All customers',
    };
    if (key === 'estimate') return `Estimated reach: ${values?.count} customers`;
    return messages[key] ?? key;
  },
}));

const targetingMock = vi.mocked(useTargetingPreview);
const retry = vi.fn();

describe('AudiencePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('announces a loading state', () => {
    targetingMock.mockReturnValue({ data: null, error: false, isLoading: true, retry });

    render(<AudiencePreview target={{ audience: 'all' }} />);

    expect(screen.getByRole('status')).toHaveTextContent('Calculating audience reach');
  });

  it('offers a retry after a request error', () => {
    targetingMock.mockReturnValue({ data: null, error: true, isLoading: false, retry });

    render(<AudiencePreview target={{ audience: 'all' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('renders a real audience count', () => {
    targetingMock.mockReturnValue({
      data: {
        audience: 'all',
        estimatedReach: 125,
        breakdown: [],
        updatedAt: '2026-07-02T00:00:00.000Z',
      },
      error: false,
      isLoading: false,
      retry,
    });

    render(<AudiencePreview target={{ audience: 'all' }} />);

    expect(screen.getByTestId('audience-preview')).toHaveTextContent('All customers');
    expect(screen.getByTestId('audience-preview')).toHaveTextContent('Estimated reach: 125 customers');
  });

  it('renders an honest empty state instead of a fallback number', () => {
    targetingMock.mockReturnValue({
      data: {
        audience: 'all',
        estimatedReach: 0,
        breakdown: [],
        updatedAt: '2026-07-02T00:00:00.000Z',
      },
      error: false,
      isLoading: false,
      retry,
    });

    render(<AudiencePreview target={{ audience: 'all' }} />);

    expect(screen.getByTestId('audience-preview')).toHaveTextContent('No eligible customers');
  });
});
