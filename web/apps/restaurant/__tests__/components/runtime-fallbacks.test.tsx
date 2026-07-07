import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MenuBoard } from '@/components/menu/menu-board';
import PromotionsListPage from '@/app/[locale]/promotions/page';
import InsightsPage from '@/app/[locale]/insights/page';
import StaffPage from '@/app/[locale]/staff/page';
import { api } from '@/lib/api';
import { fetchPromotions } from '@/lib/actions/promotion-actions';

const translate = vi.hoisted(() => (key: string, values?: Record<string, string | number>) => {
  const messages: Record<string, string> = {
    title: 'Menu',
    addItem: 'Add Item',
    summary: `${values?.items ?? 0} items · ${values?.categories ?? 0} categories`,
    loadError: 'Could not load data',
    retry: 'Retry',
    emptyTitle: 'Empty state title',
    emptyDescription: 'Empty state description',
    listTitle: 'Promotions',
    listSubtitle: 'Manage campaigns',
    listError: 'Failed to load promotions',
    create: 'Create promotion',
    emptySubtitle: 'Create your first campaign',
    emptySuggestions: 'No recommendations yet',
    description: 'Page description',
    loading: 'Loading',
    selectMember: 'Select a staff member',
    dismissError: 'Dismiss error',
    'invite.action': 'Invite staff',
  };
  return messages[key] ?? key;
});

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/actions/promotion-actions', () => ({
  fetchPromotions: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => translate,
}));

const apiGetMock = vi.mocked(api.get);
const fetchPromotionsMock = vi.mocked(fetchPromotions);

describe('restaurant runtime fallback guards', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    fetchPromotionsMock.mockReset();
  });

  it('rejects malformed menu responses instead of rendering an empty menu summary', async () => {
    apiGetMock.mockResolvedValueOnce({ items: [] });

    render(<MenuBoard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load data');
    expect(screen.queryByText('0 items · 0 categories')).not.toBeInTheDocument();
    expect(screen.queryByText('Empty state title')).not.toBeInTheDocument();
  });

  it('rejects malformed promotion responses instead of rendering an empty campaign list', async () => {
    fetchPromotionsMock.mockResolvedValueOnce({ analytics: undefined } as never);

    render(<PromotionsListPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load promotions');
    expect(screen.queryByText('Empty state title')).not.toBeInTheDocument();
    expect(screen.queryByText('Create your first campaign')).not.toBeInTheDocument();
  });

  it('shows an insights load error without resetting analytics to empty charts', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('insights unavailable'));

    render(<InsightsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('insights unavailable');
    expect(screen.queryByText('No recommendations yet')).not.toBeInTheDocument();
  });

  it('rejects malformed staff responses instead of rendering an empty staff picker', async () => {
    apiGetMock.mockResolvedValueOnce({ staff: [] });

    render(<StaffPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load data');
    expect(screen.queryByText('Select a staff member')).not.toBeInTheDocument();
  });
});
