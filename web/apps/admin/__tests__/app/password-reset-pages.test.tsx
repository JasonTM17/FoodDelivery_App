import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from '@/app/[locale]/forgot-password/page';
import ResetPasswordPage from '@/app/[locale]/reset-password/page';
import { apiPost } from '@/lib/api';

const mockedApiPost = vi.mocked(apiPost);

describe('Admin password reset pages', () => {
  beforeEach(() => {
    mockedApiPost.mockReset();
    window.history.pushState({}, '', '/vi/forgot-password');
  });

  it('requests password reset instructions without revealing account existence', async () => {
    mockedApiPost.mockResolvedValueOnce({
      message: 'If an account exists, password reset instructions will be sent when email delivery is configured.',
    });

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: ' admin@foodflow.vn ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith(
        '/auth/forgot-password',
        { email: 'admin@foodflow.vn' },
        { requireAuth: false },
      );
    });
    expect(await screen.findByText('successTitle')).toBeInTheDocument();
    expect(screen.getByText('neutralNotice')).toBeInTheDocument();
  });

  it('submits a reset token and new password to the auth contract', async () => {
    mockedApiPost.mockResolvedValueOnce({ message: 'Password reset successful' });
    window.history.pushState({}, '', '/vi/reset-password?token=reset-token');

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText('newPassword'), {
      target: { value: 'NewPass123' },
    });
    fireEvent.change(screen.getByLabelText('confirmPassword'), {
      target: { value: 'NewPass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith(
        '/auth/reset-password',
        { token: 'reset-token', password: 'NewPass123' },
        { requireAuth: false },
      );
    });
    expect(await screen.findByText('successTitle')).toBeInTheDocument();
  });

  it('blocks weak passwords client-side before calling the API', async () => {
    window.history.pushState({}, '', '/vi/reset-password?token=reset-token');

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText('newPassword'), {
      target: { value: 'weakpass' },
    });
    fireEvent.change(screen.getByLabelText('confirmPassword'), {
      target: { value: 'weakpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('weakPassword');
    expect(mockedApiPost).not.toHaveBeenCalled();
  });

  it('blocks reset submission when the token is missing', () => {
    window.history.pushState({}, '', '/vi/reset-password');

    render(<ResetPasswordPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('missingToken');
    expect(screen.getByRole('button', { name: 'submit' })).toBeDisabled();
    expect(mockedApiPost).not.toHaveBeenCalled();
  });
});
