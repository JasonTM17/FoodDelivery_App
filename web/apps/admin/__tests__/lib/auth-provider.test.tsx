import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/lib/auth-provider';

const mockedApiGet = vi.hoisted(() => vi.fn());
const mockedClearAdminSession = vi.hoisted(() => vi.fn());

vi.mock('@/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({ apiGet: mockedApiGet }));
vi.mock('@/lib/admin-session', () => ({ clearAdminSession: mockedClearAdminSession }));
vi.mock('@/lib/socket', () => ({ disconnectSocket: vi.fn() }));

function AuthProbe() {
  const { isAuthChecked, login, token, user } = useAuth();

  return (
    <>
      <button
        type="button"
        onClick={() => login('new-token', { name: 'New Admin', email: 'new@foodflow.vn', role: 'admin' })}
      >
        Log in
      </button>
      <output data-testid="auth-state">{JSON.stringify({ isAuthChecked, token, user })}</output>
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

describe('Admin AuthProvider', () => {
  it('does not let a stale bootstrap rejection clear a newly logged-in session', async () => {
    const staleValidation = deferred<{ email: string; role: string }>();
    localStorage.setItem('admin_token', 'stale-token');
    mockedApiGet.mockImplementationOnce(() => staleValidation.promise);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(mockedApiGet).toHaveBeenCalledWith('/users/me'));
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByTestId('auth-state')).toHaveTextContent('"token":"new-token"');
    staleValidation.reject(new Error('expired token'));

    await waitFor(() => {
      expect(localStorage.getItem('admin_token')).toBe('new-token');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('"token":"new-token"');
    });
    expect(mockedClearAdminSession).not.toHaveBeenCalled();
  });
});
