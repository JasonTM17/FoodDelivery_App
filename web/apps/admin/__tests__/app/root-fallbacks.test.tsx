import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';
import RootError from '@/app/error';
import NotFound from '@/app/not-found';
import LocaleRootPage from '@/app/[locale]/page';

describe('root fallback surfaces', () => {
  it('redirects locale root to the localized overview dashboard', async () => {
    vi.mocked(redirect).mockClear();

    await LocaleRootPage({ params: Promise.resolve({ locale: 'ja' }) });

    expect(redirect).toHaveBeenCalledWith('/ja/overview');
  });

  it('renders a safe 404 with an overview link', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'goToOverview' })).toHaveAttribute(
      'href',
      '/vi/overview',
    );
  });

  it('shows a generic root error without leaking the thrown message', () => {
    const reset = vi.fn();

    render(<RootError error={new Error('internal stack trace')} reset={reset} />);

    expect(screen.getByRole('alert')).toHaveTextContent('title');
    expect(screen.queryByText('internal stack trace')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'retry' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
