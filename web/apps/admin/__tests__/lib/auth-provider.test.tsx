import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/lib/auth-provider';

const mockedApiGet = vi.hoisted(() => vi.fn());
const mockedClearAdminSession = vi.hoisted(() => vi.fn());
const mockedPathname = vi.hoisted(() => vi.fn(() => '/login'));
const mockedReplace = vi.hoisted(() => vi.fn());

vi.mock('@/navigation', () => ({
  usePathname: mockedPathname,
  useRouter: () => ({ replace: mockedReplace }),
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
  it('revalidates a refreshed token before completing bootstrap', async () => {
    mockedPathname.mockReturnValue('/overview');
    localStorage.setItem('admin_token', 'expired-token');
    mockedApiGet.mockImplementationOnce(async () => {
      localStorage.setItem('admin_token', 'refreshed-token');
      return { email: 'admin@foodflow.vn', role: 'admin' };
    }).mockResolvedValueOnce({ email: 'admin@foodflow.vn', role: 'admin' });
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('"token":"refreshed-token"'));
    expect(screen.getByTestId('auth-state')).toHaveTextContent('"isAuthChecked":true');
  });

  it.each([false, true])('finishes an expired protected-session bootstrap (API cleared token: %s)', async (apiClearsToken) => {
    mockedPathname.mockReturnValue('/overview');
    localStorage.setItem('admin_token', 'expired-token');
    mockedClearAdminSession.mockImplementation(() => {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
    });
    mockedApiGet.mockImplementationOnce(async () => {
      if (apiClearsToken) localStorage.removeItem('admin_token');
      throw new Error('expired session');
    });
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('"isAuthChecked":true'));
    expect(screen.getByTestId('auth-state')).toHaveTextContent('"token":null');
    expect(mockedReplace).toHaveBeenCalledWith('/login');
    expect(localStorage.getItem('admin_token')).toBeNull();
    mockedPathname.mockReturnValue('/login');
  });

  it('does not let a stale bootstrap rejection clear a newly logged-in session', async () => {
    mockedPathname.mockReturnValue('/login');
    mockedClearAdminSession.mockClear();
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
