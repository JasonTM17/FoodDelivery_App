'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw, Users } from 'lucide-react';
import { InviteStaffDialog } from '@/components/staff/invite-staff-dialog';
import { StaffListTable } from '@/components/staff/staff-list-table';
import { DEFAULT_PERMISSIONS, StaffPermissionsMatrix } from '@/components/staff/staff-permissions-matrix';
import { api } from '@/lib/api';
import type { StaffCapability, StaffMember, StaffRole } from '@/lib/types';

export default function StaffPage() {
  const t = useTranslations('staff');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [permissions, setPermissions] = useState<Record<StaffRole, StaffCapability[]>>(DEFAULT_PERMISSIONS);
  const roleLabels = useMemo<Record<StaffRole, string>>(() => ({
    owner: t('roles.owner'),
    manager: t('roles.manager'),
    kitchen: t('roles.kitchen'),
    cashier: t('roles.cashier'),
    viewer: t('roles.viewer'),
  }), [t]);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ staff: StaffMember[] }>('/restaurant/staff');
      setStaff(data.staff);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      <div className="space-y-3" aria-label={t('loading')}>
        {[1, 2, 3].map(item => <div key={item} className="h-24 animate-pulse rounded-lg bg-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <Users className="h-5 w-5 text-brand-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('description')}</p>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={loadStaff} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('retry')}
          </button>
        </div>
      ) : null}

      <StaffListTable staff={staff} onInvite={() => setShowInvite(true)} />

      <div className="card mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{t('permissionsTitle')}</h2>
        </div>
        <StaffPermissionsMatrix
          permissions={permissions}
          roleLabels={roleLabels}
          onChange={(role, nextPermissions) => setPermissions({ ...permissions, [role]: nextPermissions })}
        />
      </div>

      <InviteStaffDialog open={showInvite} onClose={() => setShowInvite(false)} onSend={handleInvite} />
    </div>
  );
}
