import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addHours, startOfWeek } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';
import { InviteStaffDialog } from '@/components/staff/invite-staff-dialog';
import { StaffPermissionsEditor } from '@/components/staff/staff-permissions-matrix';
import { StaffScheduleGrid } from '@/components/staff/staff-schedule-grid';
import type { StaffMember } from '@/lib/types';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

const viewer: StaffMember = {
  id: 'staff-1',
  userId: 'user-1',
  name: 'Viewer User',
  email: 'viewer@example.com',
  role: 'viewer',
  permissions: ['reports'],
  isActive: true,
};

describe('staff management components', () => {
  it('focuses the invite dialog and closes it with Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InviteStaffDialog open onClose={onClose} onSend={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByPlaceholderText('invite.emailPlaceholder')).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('saves permissions for the selected member', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<StaffPermissionsEditor member={viewer} onSave={onSave} />);

    await user.click(screen.getAllByRole('checkbox', { name: 'permissionToggleMember' })[0]);
    await user.click(screen.getByRole('button', { name: 'savePermissions' }));

    expect(onSave).toHaveBeenCalledWith(['reports', 'orders']);
  });

  it('keeps owner permissions read-only', () => {
    const owner = {
      ...viewer,
      id: 'owner-1',
      role: 'owner' as const,
      permissions: ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'] as const,
    };
    render(
      <StaffPermissionsEditor
        member={{ ...owner, permissions: [...owner.permissions] }}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'savePermissions' })).toBeDisabled();
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeDisabled();
    }
  });

  it('creates an ISO timestamped shift from the weekly grid', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn().mockResolvedValue(undefined);
    const expectedStart = addHours(startOfWeek(new Date(), { weekStartsOn: 1 }), 6);

    render(<StaffScheduleGrid shifts={[]} onToggle={onToggle} />);
    await user.click(screen.getAllByRole('button', { name: 'schedule.toggleSlot' })[0]);

    expect(onToggle).toHaveBeenCalledWith({
      shiftId: undefined,
      startsAt: expectedStart.toISOString(),
      endsAt: addHours(expectedStart, 1).toISOString(),
    });
  });

  it('deletes the existing shift when an assigned slot is selected', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn().mockResolvedValue(undefined);
    const startsAt = addHours(startOfWeek(new Date(), { weekStartsOn: 1 }), 6);

    render(
      <StaffScheduleGrid
        shifts={[{
          id: 'shift-1',
          restaurantProfileId: 'staff-1',
          startsAt: startsAt.toISOString(),
          endsAt: addHours(startsAt, 1).toISOString(),
          status: 'scheduled',
        }]}
        onToggle={onToggle}
      />,
    );
    await user.click(screen.getAllByRole('button', { name: 'schedule.toggleSlot' })[0]);

    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ shiftId: 'shift-1' }));
  });
});
