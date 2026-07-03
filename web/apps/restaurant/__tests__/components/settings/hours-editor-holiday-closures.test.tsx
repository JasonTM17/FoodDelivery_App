import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HoursEditor } from '@/components/settings/hours-editor';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('next-intl', () => ({
  useTranslations: () => translate,
}));

const apiMock = vi.mocked(api);

function translate(key: string, values?: { day?: string; date?: string }) {
  const messages: Record<string, string> = {
    title: 'Opening hours',
    description: 'Set the weekly opening schedule',
    loadError: 'Could not load opening hours',
    saveSuccess: 'Opening hours saved',
    saveError: 'Could not save opening hours',
    save: 'Save schedule',
    saving: 'Saving...',
    retry: 'Retry',
    'days.monday': 'Monday',
    'days.tuesday': 'Tuesday',
    'days.wednesday': 'Wednesday',
    'days.thursday': 'Thursday',
    'days.friday': 'Friday',
    'days.saturday': 'Saturday',
    'days.sunday': 'Sunday',
    'weekly.title': 'Weekly schedule',
    'weekly.open': 'Open',
    'weekly.closed': 'Closed',
    'weekly.openTime': `${values?.day} opening time`,
    'weekly.closeTime': `${values?.day} closing time`,
    'weekly.copyAll': 'Apply to all',
    'holidays.title': 'Holiday closures',
    'holidays.description': 'Add full-day special closures.',
    'holidays.dateLabel': 'Closure date',
    'holidays.reasonLabel': 'Closure reason',
    'holidays.reasonPlaceholder': 'Reason',
    'holidays.add': 'Add',
    'holidays.empty': 'No special closure dates yet.',
    'holidays.listLabel': 'Special closure dates',
    'holidays.duplicate': 'This date is already in the closure list.',
    'holidays.noReason': 'No reason provided',
    'holidays.remove': 'Remove',
    'holidays.removeWithDate': `Remove closure on ${values?.date}`,
    dateLabel: 'Closure date',
    reasonLabel: 'Closure reason',
    reasonPlaceholder: 'Reason',
    add: 'Add',
    empty: 'No special closure dates yet.',
    listLabel: 'Special closure dates',
    duplicate: 'This date is already in the closure list.',
    noReason: 'No reason provided',
    remove: 'Remove',
    removeWithDate: `Remove closure on ${values?.date}`,
    'preview.title': 'This week preview',
    'preview.closed': 'Closed',
    'preview.shortDays.monday': 'Mon',
    'preview.shortDays.tuesday': 'Tue',
    'preview.shortDays.wednesday': 'Wed',
    'preview.shortDays.thursday': 'Thu',
    'preview.shortDays.friday': 'Fri',
    'preview.shortDays.saturday': 'Sat',
    'preview.shortDays.sunday': 'Sun',
  };
  return messages[key] ?? key;
}

describe('HoursEditor holiday closures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue({
      id: 'restaurant-1',
      name: 'Pho 24',
      slug: 'pho-24',
      description: 'Vietnamese food',
      phone: '0900000000',
      isActive: true,
      openingHours: [],
      holidayClosures: [{ id: 'closure-1', date: '2026-02-10', reason: 'Tet holiday' }],
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    });
    apiMock.patch.mockResolvedValue({});
  });

  it('saves persisted holiday closures with the opening-hours profile payload', async () => {
    const user = userEvent.setup();
    render(<HoursEditor />);

    await screen.findByText('2026-02-10');

    await user.type(await screen.findByLabelText('Closure date'), '2026-02-11');
    await user.type(screen.getByLabelText('Closure reason'), '  Team day  ');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: 'Save schedule' }));

    await waitFor(() => expect(apiMock.patch).toHaveBeenCalled());
    expect(apiMock.patch).toHaveBeenCalledWith('/restaurant/profile', {
      openingHours: expect.any(Array),
      holidayClosures: [
        { date: '2026-02-10', reason: 'Tet holiday' },
        { date: '2026-02-11', reason: 'Team day' },
      ],
    });
  });
});
