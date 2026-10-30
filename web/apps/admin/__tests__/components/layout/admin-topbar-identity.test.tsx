import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminTopbar from '@/components/layout/admin-topbar';

const session = vi.hoisted(() => ({
  user: { name: 'Memory Admin', email: 'admin@example.test', role: 'admin' } as
    { name: string; email: string; role: string } | null,
  logout: vi.fn(),
}));
vi.mock('@/lib/auth-provider', () => ({ useAuth: () => session }));

describe('Admin topbar identity', () => {
  it('uses validated context rather than legacy storage and resets after logout', async () => {
    localStorage.setItem('admin_user', JSON.stringify({ name: 'Untrusted cached name' }));
    const view = render(<AdminTopbar onOpenNavigation={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'topbar.accountMenu' }), { key: 'ArrowDown' });
    expect(await screen.findByText('Memory Admin')).toBeInTheDocument();
    expect(screen.queryByText('Untrusted cached name')).not.toBeInTheDocument();
    session.user = null;
    view.rerender(<AdminTopbar onOpenNavigation={vi.fn()} />);
    expect(screen.queryByText('Memory Admin')).not.toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
