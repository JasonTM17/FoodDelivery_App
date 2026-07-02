'use client';

import { useTranslations } from 'next-intl';
import type { StaffCapability, StaffRole } from '@/lib/types';

interface StaffPermissionsMatrixProps {
  permissions: Record<StaffRole, StaffCapability[]>;
  roleLabels: Record<StaffRole, string>;
  onChange: (role: StaffRole, permissions: StaffCapability[]) => void;
  readOnly?: boolean;
}

const allCapabilities: StaffCapability[] = ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'];

const DEFAULT_PERMISSIONS: Record<StaffRole, StaffCapability[]> = {
  owner: ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'],
  manager: ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'],
  kitchen: ['orders'],
  cashier: ['orders'],
  viewer: ['reports'],
};

export function StaffPermissionsMatrix({
  permissions,
  roleLabels,
  onChange,
  readOnly,
}: StaffPermissionsMatrixProps) {
  const t = useTranslations('staff');
  const roles = Object.keys(permissions) as StaffRole[];

  return (
    <div className="space-y-3" data-testid="staff-permissions-matrix">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">{t('matrixTitle')}</h4>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('table.columns.role')}</th>
              {allCapabilities.map(capability => (
                <th key={capability} className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                  {t(`capabilities.${capability}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role} className="border-b last:border-b-0">
                <td className="px-3 py-2 text-xs font-medium text-gray-900">{roleLabels[role] || role}</td>
                {allCapabilities.map((capability) => {
                  const hasCapability = permissions[role]?.includes(capability) || false;
                  const isOwner = role === 'owner';
                  return (
                    <td key={capability} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={hasCapability}
                        disabled={readOnly || isOwner}
                        onChange={(event) => {
                          const current = permissions[role] || [];
                          const next = event.target.checked
                            ? [...current, capability]
                            : current.filter(item => item !== capability);
                          onChange(role, next);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600"
                        aria-label={t('permissionToggle', { role: roleLabels[role], capability: t(`capabilities.${capability}`) })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DEFAULT_PERMISSIONS };
