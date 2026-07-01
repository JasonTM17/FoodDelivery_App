'use client';

import type { StaffMember, StaffRole } from '@/lib/types';
import type { ReactNode } from 'react';
import { cn, formatTimeAgo } from '@/lib/utils';
import { Crown, ChefHat, User2, MoreHorizontal, ShieldCheck, CreditCard } from 'lucide-react';

interface StaffListTableProps {
  staff: StaffMember[];
  onInvite?: () => void;
  onEdit?: (id: string) => void;
}

const ROLE_ICONS: Record<StaffRole, ReactNode> = {
  owner: <Crown className="h-3.5 w-3.5" />,
  manager: <ShieldCheck className="h-3.5 w-3.5" />,
  kitchen: <ChefHat className="h-3.5 w-3.5" />,
  cashier: <CreditCard className="h-3.5 w-3.5" />,
  viewer: <User2 className="h-3.5 w-3.5" />,
};

const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Chủ quán',
  manager: 'Quản lý',
  kitchen: 'Bếp',
  cashier: 'Thu ngân',
  viewer: 'Chỉ xem',
};

export function StaffListTable({ staff, onInvite, onEdit }: StaffListTableProps) {
  return (
    <div className="space-y-4" data-testid="staff-list-table">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Nhân viên ({staff.length})</h2>
        {onInvite && (
          <button type="button" onClick={onInvite} className="btn-primary text-sm">
            + Mời nhân viên
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Vai trò</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Quyền</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase">Tham gia</th>
              <th className="py-3 px-2" />
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                    member.role === 'owner' ? 'bg-amber-50 text-amber-700'
                      : member.role === 'manager' ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                  )}>
                    {ROLE_ICONS[member.role]}
                    {ROLE_LABELS[member.role]}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap gap-0.5">
                    {member.permissions.slice(0, 3).map((permission) => (
                      <span key={permission} className="text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-600">
                        {permission}
                      </span>
                    ))}
                    {member.permissions.length > 3 && (
                      <span className="text-xs text-gray-400">+{member.permissions.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    member.isActive === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                  )}>
                    {member.isActive === false ? 'Tạm khoá' : 'Đang hoạt động'}
                  </span>
                </td>
                <td className="py-3 px-2 text-xs text-gray-500">
                  {member.lastActive ? formatTimeAgo(member.lastActive) : member.joinedAt ? formatTimeAgo(member.joinedAt) : '—'}
                </td>
                <td className="py-3 px-2 text-right">
                  <button type="button" onClick={() => onEdit?.(member.id)} className="btn-ghost p-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
