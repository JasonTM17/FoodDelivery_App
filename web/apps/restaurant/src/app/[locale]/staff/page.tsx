'use client';

import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock3, RefreshCw, Users, X } from 'lucide-react';
import { InviteStaffDialog } from '@/components/staff/invite-staff-dialog';
import { StaffListTable } from '@/components/staff/staff-list-table';
import { StaffPermissionsEditor } from '@/components/staff/staff-permissions-matrix';
import { StaffScheduleGrid } from '@/components/staff/staff-schedule-grid';
import { useStaffManagement } from '@/hooks/use-staff-management';
import type { StaffRole } from '@/lib/types';

const dateLocales: Record<string, string> = { en: 'en-US', ja: 'ja-JP', vi: 'vi-VN' };

export default function StaffPage() {
  const t = useTranslations('staff');
  const locale = useLocale();
  const [showInvite, setShowInvite] = useState(false);
  const {
    staff,
    invites,
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
    clearActionError,
  } = useStaffManagement({
    loadErrorMessage: t('loadError'),
    actionErrorMessage: t('actionError'),
  });

  const closeInvite = useCallback(() => setShowInvite(false), []);
  const handleInvite = useCallback(async (emails: string[], role: StaffRole) => {
    await inviteStaff(emails, role);
    setShowInvite(false);
  }, [inviteStaff]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <Users className="h-5 w-5 text-brand-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500">{t('description')}</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowInvite(true)} className="btn-primary text-sm">
          {t('invite.action')}
        </button>
      </div>

      {error ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void loadStaff()} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('retry')}
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{actionError}</span>
          <button type="button" onClick={clearActionError} className="rounded p-1 hover:bg-red-100" aria-label={t('dismissError')}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-label={t('loading')}>
          {[1, 2, 3].map(item => <div key={item} className="h-24 animate-pulse rounded-lg bg-gray-100" />)}
        </div>
      ) : (
        <>
          <StaffListTable
            staff={staff}
            selectedId={selectedStaffId}
            onEdit={setSelectedStaffId}
          />

          {invites.length > 0 ? (
            <section className="card" aria-labelledby="pending-invites-title">
              <div className="mb-3 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <h2 id="pending-invites-title" className="text-sm font-semibold text-gray-900">
                  {t('pendingInvites.title', { count: invites.length })}
                </h2>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {invites.map(invite => (
                  <div key={invite.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {t('pendingInvites.meta', {
                        role: t(`roles.${invite.role}`),
                        date: new Date(invite.expiresAt).toLocaleDateString(dateLocales[locale] ?? 'vi-VN'),
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {selectedMember ? (
            <section className="card space-y-6" aria-label={t('manageMember', { name: selectedMember.name })}>
              <StaffPermissionsEditor
                member={selectedMember}
                saving={savingPermissions}
                onSave={savePermissions}
              />
              <div className="border-t border-gray-200 pt-5">
                <StaffScheduleGrid
                  shifts={selectedShifts}
                  busy={mutatingShift}
                  readOnly={selectedMember.isActive === false}
                  onToggle={toggleShift}
                />
              </div>
            </section>
          ) : (
            <div className="card py-10 text-center text-sm text-gray-500">{t('selectMember')}</div>
          )}
        </>
      )}

      <InviteStaffDialog open={showInvite} onClose={closeInvite} onSend={handleInvite} />
    </div>
  );
}
