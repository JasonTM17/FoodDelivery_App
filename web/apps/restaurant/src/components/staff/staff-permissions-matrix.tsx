'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Save, ShieldCheck } from 'lucide-react';
import { STAFF_CAPABILITIES } from '@/lib/staff-permissions';
import type { StaffCapability, StaffMember } from '@/lib/types';

interface StaffPermissionsEditorProps {
  member: StaffMember;
  saving?: boolean;
  onSave: (permissions: StaffCapability[]) => Promise<void>;
}

export function StaffPermissionsEditor({
  member,
  saving = false,
  onSave,
}: StaffPermissionsEditorProps) {
  const t = useTranslations('staff');
  const [draft, setDraft] = useState<StaffCapability[]>(member.permissions);

  useEffect(() => {
    setDraft(member.permissions);
  }, [member.id, member.permissions]);

  const dirty = useMemo(() => (
    [...draft].sort().join('|') !== [...member.permissions].sort().join('|')
  ), [draft, member.permissions]);
  const readOnly = member.role === 'owner';

  const toggle = (capability: StaffCapability, checked: boolean) => {
    setDraft(current => (
      checked
        ? Array.from(new Set([...current, capability]))
        : current.filter(item => item !== capability)
    ));
  };

  return (
    <div className="space-y-4" data-testid="staff-permissions-editor">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
            {t('permissionEditorTitle', { name: member.name })}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {readOnly ? t('ownerPermissionsLocked') : t('permissionEditorDescription')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onSave(draft)}
          disabled={readOnly || saving || !dirty}
          className="btn-primary inline-flex items-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? t('savingPermissions') : t('savePermissions')}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STAFF_CAPABILITIES.map((capability) => {
          const checked = readOnly || draft.includes(capability);
          return (
            <label
              key={capability}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={readOnly || saving}
                onChange={event => toggle(capability, event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600"
                aria-label={t('permissionToggleMember', {
                  member: member.name,
                  capability: t(`capabilities.${capability}`),
                })}
              />
              <span>{t(`capabilities.${capability}`)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
