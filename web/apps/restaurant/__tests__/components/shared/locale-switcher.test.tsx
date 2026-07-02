import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocaleSwitcher } from '@/components/locale-switcher';

const replace = vi.fn();

vi.mock('@/navigation', () => ({
  usePathname: () => '/orders',
  useRouter: () => ({ replace }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'ja',
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    const messages: Record<string, string> = {
      triggerAria: `Switch language. Current language: ${params?.language ?? ''}`,
      menuAria: 'Language selector',
      'languages.vi': 'Vietnamese',
      'languages.en': 'English',
      'languages.ja': 'Japanese',
    };
    return messages[key] ?? key;
  },
}));

describe('LocaleSwitcher', () => {
  it('opens a localized language menu and preserves the route when switching locale', () => {
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';

    render(<LocaleSwitcher />);

    fireEvent.click(screen.getByRole('button', {
      name: 'Switch language. Current language: Japanese',
    }));

    expect(screen.getByRole('menu', { name: 'Language selector' })).toBeVisible();
    expect(screen.getByRole('menuitemradio', { name: /Japanese/ })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByRole('menuitemradio', { name: /English/ }));

    expect(replace).toHaveBeenCalledWith('/orders', { locale: 'en' });
    expect(document.cookie).toContain('NEXT_LOCALE=en');
  });
});
