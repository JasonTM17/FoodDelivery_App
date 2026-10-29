import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UserRoleBadge from '@/components/badges/user-role-badge';

describe('UserRoleBadge', () => {
  it('renders customer role with distinctive sky frame styling', () => {
    const { container } = render(<UserRoleBadge role="customer" />);
    expect(screen.getByText('customer')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-sky-50', 'text-sky-700', 'border-sky-200/90', 'rounded-md');
  });

  it('renders driver role with amber frame styling', () => {
    const { container } = render(<UserRoleBadge role="driver" />);
    expect(screen.getByText('driver')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-amber-50', 'text-amber-800', 'border-amber-200/90');
  });

  it('renders restaurant role with emerald frame styling', () => {
    const { container } = render(<UserRoleBadge role="restaurant" />);
    expect(screen.getByText('restaurant_owner')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-emerald-50', 'text-emerald-700', 'border-emerald-200/90');
  });

  it('renders admin role with purple frame styling', () => {
    const { container } = render(<UserRoleBadge role="admin" />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-purple-50', 'text-purple-700', 'border-purple-200/90');
  });

  it('renders unknown role gracefully with default styling', () => {
    const { container } = render(<UserRoleBadge role="moderator" />);
    expect(screen.getByText('moderator')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-slate-50', 'text-slate-700');
  });

  it('supports small size prop', () => {
    const { container } = render(<UserRoleBadge role="customer" size="sm" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-[11px]');
  });
});
