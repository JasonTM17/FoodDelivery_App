import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayoutClient } from '@/components/layout/admin-layout-client';
import { PageHeader } from '@/components/layout/admin-page-header';
import { AuthProvider, useAuth } from '@/lib/auth-provider';
import { apiGet } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

vi.mock('@/lib/socket', () => ({
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(),
}));

const mockedApiGet = vi.mocked(apiGet);
const mockedDisconnect = vi.mocked(disconnectSocket);

function LogoutFixture() {
  const { logout } = useAuth();
  return <button onClick={logout}>logout fixture</button>;
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Admin shell', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedApiGet.mockReset();
    mockedDisconnect.mockReset();
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

  it('keeps the mobile logout control above the scrolling navigation layer', async () => {
    render(
      <AdminLayoutClient>
        <div>page content</div>
      </AdminLayoutClient>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'topbar.openNavigation' }));

    const navigationDialog = screen.getByRole('dialog', { name: 'sidebar.mobileTitle' });
    const navigation = within(navigationDialog).getByRole('navigation', { name: 'sidebar.navigation' });
    const logoutButton = within(navigationDialog).getByRole('button', { name: 'common.logout' });

    expect(navigation).toHaveClass('relative', 'z-0');
    expect(logoutButton.parentElement).toHaveClass('relative', 'z-10', 'bg-sidebar');
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

  it('clears the complete admin session on logout and disconnects the socket', async () => {
    localStorage.setItem('admin_token', 'access-token');
    localStorage.setItem('admin_refresh_token', 'refresh-token');
    localStorage.setItem('admin_user', JSON.stringify({ name: 'Admin', email: 'a@b.c', role: 'admin' }));
    mockedApiGet.mockResolvedValueOnce({
      email: 'a@b.c',
      role: 'admin',
      fullName: 'Admin',
    });

    renderWithProviders(<LogoutFixture />);

    fireEvent.click(await screen.findByRole('button', { name: 'logout fixture' }));

    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(localStorage.getItem('admin_refresh_token')).toBeNull();
    expect(localStorage.getItem('admin_user')).toBeNull();
    expect(mockedDisconnect).toHaveBeenCalled();
  });
});
