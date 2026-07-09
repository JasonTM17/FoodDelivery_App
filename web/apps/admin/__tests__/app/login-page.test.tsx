import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/[locale]/login/page';
import { apiPost } from '@/lib/api';

const mockedApiPost = vi.mocked(apiPost);
const credentialFixture = (name: string) => `${name}-credential`;
const tokenFixture = (name: string) => `${name}-token`;

describe('Admin LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedApiPost.mockReset();
  });

  it('uses the shared auth login endpoint and stores admin tokens', async () => {
    mockedApiPost.mockResolvedValueOnce({
      accessToken: tokenFixture('admin-access'),
      refreshToken: tokenFixture('admin-refresh'),
      user: { email: 'admin@foodflow.vn', role: 'admin' },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'admin@foodflow.vn' },
    });
    fireEvent.change(screen.getByLabelText('password'), {
      target: { value: credentialFixture('admin') },
    });
    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith(
        '/auth/login',
        {
          email: 'admin@foodflow.vn',
          password: credentialFixture('admin'),
        },
        { requireAuth: false },
      );
    });
    expect(localStorage.getItem('admin_token')).toBe(tokenFixture('admin-access'));
    expect(localStorage.getItem('admin_refresh_token')).toBe(tokenFixture('admin-refresh'));
  });

  it('links to the locale-aware password recovery route', () => {
    render(<LoginPage />);

    expect(screen.getByRole('link', { name: 'forgotPassword' })).toHaveAttribute('href', '/forgot-password');
  });

  it('does not persist tokens when the authenticated user is not an admin', async () => {
    mockedApiPost.mockResolvedValueOnce({
      accessToken: tokenFixture('customer-access'),
      refreshToken: tokenFixture('customer-refresh'),
      user: { email: 'customer@foodflow.vn', role: 'customer' },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'customer@foodflow.vn' },
    });
    fireEvent.change(screen.getByLabelText('password'), {
      target: { value: credentialFixture('customer') },
    });
    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    await screen.findByText('adminOnly');
    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_refresh_token')).toBeNull();
  });
});
