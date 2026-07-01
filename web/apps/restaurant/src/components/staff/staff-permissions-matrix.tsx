'use client';

import type { StaffRole, StaffCapability } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StaffPermissionsMatrixProps {
  permissions: Record<StaffRole, StaffCapability[]>;
  roleLabels: Record<StaffRole, string>;
  onChange: (role: StaffRole, permissions: StaffCapability[]) => void;
  readOnly?: boolean;
}

const ALL_CAPABILITIES: StaffCapability[] = ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'];

const CAPABILITY_LABELS: Record<StaffCapability, string> = {
  orders: 'Đơn hàng',
  menu: 'Thực đơn',
  reports: 'Báo cáo',
  settings: 'Cài đặt',
  staff: 'Nhân viên',
  promotions: 'Khuyến mãi',
};

const DEFAULT_PERMISSIONS: Record<StaffRole, StaffCapability[]> = {
  owner: ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'],
  manager: ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'],
  kitchen: ['orders'],
  cashier: ['orders'],
  viewer: ['reports'],
};

export function StaffPermissionsMatrix({
  permissions, roleLabels, onChange, readOnly,
}: StaffPermissionsMatrixProps) {
  const roles = Object.keys(permissions) as StaffRole[];

  return (
    <div className="space-y-3" data-testid="staff-permissions-matrix">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Ma trận phân quyền</h4>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Vai trò</th>
              {ALL_CAPABILITIES.map((cap) => (
                <th key={cap} className="text-center py-2 px-3 text-xs font-medium text-gray-500">
                  {CAPABILITY_LABELS[cap]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role} className="border-b last:border-b-0">
                <td className="py-2 px-3 text-xs font-medium text-gray-900">
                  {roleLabels[role] || role}
                </td>
                {ALL_CAPABILITIES.map((cap) => {
                  const has = permissions[role]?.includes(cap) || false;
                  const isOwner = role === 'owner';
                  return (
                    <td key={cap} className="text-center py-2 px-3">
                      <input
                        type="checkbox"
                        checked={has}
                        disabled={readOnly || isOwner}
                        onChange={(e) => {
                          const current = permissions[role] || [];
                          const next = e.target.checked
                            ? [...current, cap]
                            : current.filter(c => c !== cap);
                          onChange(role, next);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600"
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
