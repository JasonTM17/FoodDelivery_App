'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { StaffListTable } from '@/components/staff/staff-list-table';
import { InviteStaffDialog } from '@/components/staff/invite-staff-dialog';
import { StaffPermissionsMatrix, DEFAULT_PERMISSIONS } from '@/components/staff/staff-permissions-matrix';
import { api } from '@/lib/api';
import type { StaffMember, StaffRole, StaffCapability } from '@/lib/types';

const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Chủ quán',
  manager: 'Quản lý',
  kitchen: 'Bếp',
  cashier: 'Thu ngân',
  viewer: 'Chỉ xem',
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [permissions, setPermissions] = useState<Record<StaffRole, StaffCapability[]>>(DEFAULT_PERMISSIONS);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ staff: StaffMember[] }>('/restaurant/staff');
      setStaff(data.staff);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const handleInvite = async (emails: string[], role: StaffRole) => {
    await api.post('/restaurant/staff/invite', { emails, role, permissions: DEFAULT_PERMISSIONS[role] ?? [] });
    setShowInvite(false);
    await loadStaff();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-lg bg-gray-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <Users className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý nhân viên</h1>
          <p className="text-sm text-gray-500">Quản lý nhân viên, phân quyền và lịch làm việc</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={loadStaff} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium">
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </button>
        </div>
      )}

      <StaffListTable staff={staff} onInvite={() => setShowInvite(true)} />

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Phân quyền</h2>
        </div>
        <StaffPermissionsMatrix
          permissions={permissions}
          roleLabels={ROLE_LABELS}
          onChange={(role, nextPermissions) => setPermissions({ ...permissions, [role]: nextPermissions })}
        />
      </div>

      <InviteStaffDialog
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onSend={handleInvite}
      />
    </div>
  );
}
