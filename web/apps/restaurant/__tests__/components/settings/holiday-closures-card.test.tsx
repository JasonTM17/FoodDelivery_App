import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HolidayClosuresCard } from '@/components/settings/holiday-closures-card';
import type { HolidayClosure } from '@/lib/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { date?: string }) => {
    const messages: Record<string, string> = {
      title: 'Holiday closures',
      description: 'Add full-day special closures.',
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
    };
    return messages[key] ?? key;
  },
}));

describe('HolidayClosuresCard', () => {
  it('renders an honest empty state before closures are configured', () => {
    render(<HolidayClosuresCard closures={[]} onChange={vi.fn()} />);

    expect(screen.getByText('No special closure dates yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('adds a closure with a trimmed reason', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HolidayClosuresCard closures={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText('Closure date'), '2026-02-10');
    await user.type(screen.getByLabelText('Closure reason'), '  Tet holiday  ');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onChange).toHaveBeenCalledWith([{ date: '2026-02-10', reason: 'Tet holiday' }]);
  });

  it('prevents duplicate closure dates', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <HolidayClosuresCard
        closures={[{ id: 'closure-1', date: '2026-02-10', reason: 'Tet holiday' }]}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText('Closure date'), '2026-02-10');

    expect(screen.getByText('This date is already in the closure list.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a closure by date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const closures: HolidayClosure[] = [
      { id: 'closure-1', date: '2026-02-10', reason: 'Tet holiday' },
      { id: 'closure-2', date: '2026-02-11', reason: null },
    ];
    render(<HolidayClosuresCard closures={closures} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Remove closure on 2026-02-10' }));

    expect(onChange).toHaveBeenCalledWith([{ id: 'closure-2', date: '2026-02-11', reason: null }]);
  });
});
