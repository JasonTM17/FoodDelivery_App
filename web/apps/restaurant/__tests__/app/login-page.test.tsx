import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/[locale]/login/page';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, Record<string, string>> = {
      login: {
        title: 'Restaurant Manager',
        description: 'Sign in to manage your orders and menu',
        emailPlaceholder: 'restaurant@email.com',
        loggingIn: 'Signing in…',
        restaurantOnly: 'This dashboard is available to restaurant accounts only.',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
      },
      common: {
        email: 'Email',
        password: 'Password',
        login: 'Sign In',
      },
      errors: {
        generic: 'Something went wrong.',
      },
    };

    return messages[namespace]?.[key] ?? `${namespace}.${key}`;
  },
}));

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
  setStoredRestaurant: vi.fn(),
  setToken: vi.fn(),
}));

describe('Restaurant LoginPage', () => {
  it('uses localized accessible names when toggling password visibility', () => {
    render(<LoginPage />);

    const password = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: 'Show password' });

    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(toggle);

    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeVisible();
  });
});
