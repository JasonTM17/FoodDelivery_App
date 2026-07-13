import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/lib/auth-provider';

const mockedGet = vi.hoisted(() => vi.fn());

vi.mock('@/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: { get: mockedGet },
  setToken: (token: string) => localStorage.setItem('restaurant_token', token),
  clearToken: () => {
    localStorage.removeItem('restaurant_token');
    localStorage.removeItem('restaurant_refresh_token');
    localStorage.removeItem('restaurant_data');
  },
  setStoredRestaurant: (restaurant: unknown) =>
    localStorage.setItem('restaurant_data', JSON.stringify(restaurant)),
  getStoredRestaurant: () => {
    const restaurant = localStorage.getItem('restaurant_data');
    return restaurant ? JSON.parse(restaurant) : null;
  },
}));

vi.mock('@/lib/socket', () => ({ disconnectSocket: vi.fn() }));
vi.mock('@/lib/tracking-socket', () => ({ disconnectTrackingSocket: vi.fn() }));

function AuthProbe() {
  const { isAuthChecked, login, permissions, token } = useAuth();

  return (
    <>
      <button type="button" onClick={() => void login('new-token')}>Log in</button>
      <output data-testid="auth-state">{JSON.stringify({ isAuthChecked, permissions, token })}</output>
    </>
  );
}

function deferred<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

describe('Restaurant AuthProvider', () => {
  it('hydrates the restaurant profile after login and ignores a stale bootstrap rejection', async () => {
    const staleValidation = deferred<{ email: string; role: string }>();
    const restaurant = {
      id: 'restaurant-1',
      name: 'FoodFlow Test Restaurant',
      membership: { role: 'manager', permissions: ['orders', 'menu'] },
    };
    localStorage.setItem('restaurant_token', 'stale-token');
    mockedGet
      .mockImplementationOnce(() => staleValidation.promise)
      .mockResolvedValueOnce(restaurant);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/users/me'));
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/restaurant/profile'));
    expect(JSON.parse(localStorage.getItem('restaurant_data') ?? 'null')).toEqual(restaurant);
    expect(screen.getByTestId('auth-state')).toHaveTextContent('"token":"new-token"');

    staleValidation.reject(new Error('expired token'));

    await waitFor(() => {
      expect(localStorage.getItem('restaurant_token')).toBe('new-token');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('"token":"new-token"');
    });
  });
});
