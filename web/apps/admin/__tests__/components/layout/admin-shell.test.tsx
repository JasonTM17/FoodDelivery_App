import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminLayoutClient } from '@/components/layout/admin-layout-client';
import { PageHeader } from '@/components/layout/admin-page-header';
import { AuthProvider, useAuth } from '@/lib/auth-provider';

function LogoutFixture() {
  const { logout } = useAuth();
  return <button onClick={logout}>logout fixture</button>;
}

describe('Admin shell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens mobile navigation as a labelled dialog and closes after navigation', async () => {
    render(
      <AdminLayoutClient>
        <div>page content</div>
      </AdminLayoutClient>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'topbar.openNavigation' }));

    const navigationDialog = screen.getByRole('dialog', { name: 'sidebar.mobileTitle' });
    expect(navigationDialog).toHaveAccessibleDescription('sidebar.mobileDescription');
    const overviewLink = within(navigationDialog).getByRole('link', { name: 'nav.overview' });
    await waitFor(() => expect(overviewLink).toHaveFocus());

    fireEvent.click(overviewLink);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'sidebar.mobileTitle' })).not.toBeInTheDocument();
    });
  });

  it('localizes breadcrumb destinations without compatibility redirects', () => {
    render(
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Settings', href: '/settings' },
          { label: 'Users', href: '/users' },
          { label: 'Detail' },
        ]}
        title="User detail"
      />,
    );

    expect(screen.getByRole('link', { name: 'home' })).toHaveAttribute('href', '/vi/overview');
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'settings' })).toHaveAttribute('href', '/vi/settings');
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/vi/users');
  });

  it('clears the complete admin session on logout', async () => {
    localStorage.setItem('admin_token', 'access-token');
    localStorage.setItem('admin_refresh_token', 'refresh-token');
    localStorage.setItem('admin_user', JSON.stringify({ name: 'Admin' }));

    render(
      <AuthProvider>
        <LogoutFixture />
      </AuthProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'logout fixture' }));

    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_refresh_token')).toBeNull();
    expect(localStorage.getItem('admin_user')).toBeNull();
  });
});
