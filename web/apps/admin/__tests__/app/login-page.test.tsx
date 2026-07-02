import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/[locale]/login/page';
import { apiPost } from '@/lib/api';

const mockedApiPost = vi.mocked(apiPost);

describe('Admin LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedApiPost.mockReset();
  });

  it('uses the shared auth login endpoint and stores admin tokens', async () => {
    mockedApiPost.mockResolvedValueOnce({
      accessToken: 'admin-access',
      refreshToken: 'admin-refresh',
      user: { email: 'admin@foodflow.vn', role: 'admin' },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'admin@foodflow.vn' },
    });
    fireEvent.change(screen.getByLabelText('password'), {
      target: { value: 'Admin@123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@foodflow.vn',
        password: 'Admin@123',
      });
    });
    expect(localStorage.getItem('admin_token')).toBe('admin-access');
    expect(localStorage.getItem('admin_refresh_token')).toBe('admin-refresh');
  });

  it('does not persist tokens when the authenticated user is not an admin', async () => {
    mockedApiPost.mockResolvedValueOnce({
      accessToken: 'customer-access',
      refreshToken: 'customer-refresh',
      user: { email: 'customer@foodflow.vn', role: 'customer' },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'customer@foodflow.vn' },
    });
    fireEvent.change(screen.getByLabelText('password'), {
      target: { value: 'Customer@123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'login' }));

    await screen.findByText('adminOnly');
    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_refresh_token')).toBeNull();
  });
});
