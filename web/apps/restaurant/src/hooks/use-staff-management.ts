'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type {
  StaffCapability,
  StaffInvite,
  StaffMember,
  StaffOverview,
  StaffRole,
  StaffShift,
} from '@/lib/types';
import { DEFAULT_STAFF_PERMISSIONS } from '@/lib/staff-permissions';
import type { StaffShiftToggle } from '@/components/staff/staff-schedule-grid';

interface UseStaffManagementOptions {
  loadErrorMessage: string;
  actionErrorMessage: string;
}

export function useStaffManagement({
  loadErrorMessage,
  actionErrorMessage,
}: UseStaffManagementOptions) {
  const [overview, setOverview] = useState<StaffOverview>({ staff: [], invites: [], shifts: [] });
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [mutatingShift, setMutatingShift] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<unknown>('/restaurant/staff');
      if (!isStaffOverview(data)) throw new Error(loadErrorMessage);
      setOverview(data);
      setSelectedStaffId(current => (
        data.staff.some(member => member.id === current)
          ? current
          : data.staff.find(member => member.role !== 'owner')?.id ?? data.staff[0]?.id ?? ''
      ));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : loadErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadErrorMessage]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const selectedMember = useMemo(
    () => overview.staff.find(member => member.id === selectedStaffId) ?? null,
    [overview.staff, selectedStaffId],
  );
  const selectedShifts = useMemo(
    () => overview.shifts.filter(shift => shift.restaurantProfileId === selectedStaffId),
    [overview.shifts, selectedStaffId],
  );

  const inviteStaff = useCallback(async (emails: string[], role: StaffRole) => {
    const response = await api.post<{ invites: Array<StaffInvite & { token?: string }> }>('/restaurant/staff/invite', {
      emails,
      role,
      permissions: DEFAULT_STAFF_PERMISSIONS[role] ?? [],
    });
    const safeInvites = response.invites.map(invite => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      permissions: invite.permissions,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    }));
    setOverview(current => ({
      ...current,
      invites: [...safeInvites, ...current.invites],
    }));
  }, []);

  const savePermissions = useCallback(async (permissions: StaffCapability[]) => {
    if (!selectedMember) return;
    setSavingPermissions(true);
    setActionError('');
    try {
      await api.patch(`/restaurant/staff/${selectedMember.id}`, { permissions });
      setOverview(current => ({
        ...current,
        staff: current.staff.map(member => (
          member.id === selectedMember.id ? { ...member, permissions } : member
        )),
      }));
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : actionErrorMessage);
    } finally {
      setSavingPermissions(false);
    }
  }, [actionErrorMessage, selectedMember]);

  const toggleShift = useCallback(async ({ shiftId, startsAt, endsAt }: StaffShiftToggle) => {
    if (!selectedMember) return;
    setMutatingShift(true);
    setActionError('');
    try {
      if (shiftId) {
        await api.delete(`/restaurant/staff/shifts/${shiftId}`);
        setOverview(current => ({
          ...current,
          shifts: current.shifts.filter(shift => shift.id !== shiftId),
        }));
        return;
      }
      const created = await api.post<StaffShift>('/restaurant/staff/shifts', {
        restaurantProfileId: selectedMember.id,
        startsAt,
        endsAt,
      });
      setOverview(current => ({ ...current, shifts: [...current.shifts, created] }));
    } catch (shiftError) {
      setActionError(shiftError instanceof Error ? shiftError.message : actionErrorMessage);
    } finally {
      setMutatingShift(false);
    }
  }, [actionErrorMessage, selectedMember]);

  return {
    ...overview,
    selectedMember,
    selectedShifts,
    selectedStaffId,
    loading,
    savingPermissions,
    mutatingShift,
    error,
    actionError,
    loadStaff,
    inviteStaff,
    savePermissions,
    toggleShift,
    setSelectedStaffId,
    clearActionError: () => setActionError(''),
  };
}

function isStaffOverview(value: unknown): value is StaffOverview {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Record<keyof StaffOverview, unknown>>;
  return (
    Array.isArray(candidate.staff) &&
    Array.isArray(candidate.invites) &&
    Array.isArray(candidate.shifts)
  );
}
