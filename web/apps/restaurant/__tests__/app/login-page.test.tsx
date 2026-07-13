import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/[locale]/login/page';

const mockedPost = vi.hoisted(() => vi.fn());
const mockedLogin = vi.hoisted(() => vi.fn());

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
  api: { post: mockedPost },
  setStoredRestaurant: vi.fn(),
  setToken: vi.fn(),
}));

vi.mock('@/lib/auth-provider', () => ({
  useAuth: () => ({ login: mockedLogin }),
}));

describe('Restaurant LoginPage', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedLogin.mockReset();
  });

  it('uses localized accessible names when toggling password visibility', () => {
    render(<LoginPage />);

    const password = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: 'Show password' });

    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(toggle);

    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeVisible();
  });

  it('updates the in-memory session before navigating to protected orders', async () => {
    const restaurant = { id: 'restaurant-1', name: 'Phở Thìn' };
    mockedPost.mockResolvedValueOnce({
      accessToken: 'restaurant-access-token',
      refreshToken: 'restaurant-refresh-token',
      user: { name: 'Partner', email: 'restaurant1@foodflow.vn', role: 'restaurant' },
      restaurant,
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'restaurant1@foodflow.vn' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Partner@123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'restaurant1@foodflow.vn', password: 'Partner@123' },
        { requireAuth: false },
      );
    });
    expect(mockedLogin).toHaveBeenCalledWith('restaurant-access-token', restaurant);
  });
});
