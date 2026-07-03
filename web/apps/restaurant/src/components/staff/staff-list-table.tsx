'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChefHat, CreditCard, Crown, MoreHorizontal, ShieldCheck, User2 } from 'lucide-react';
import type { StaffMember, StaffRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StaffListTableProps {
  staff: StaffMember[];
  onInvite?: () => void;
  onEdit?: (id: string) => void;
  selectedId?: string;
}

const roleIcons: Record<StaffRole, ReactNode> = {
  owner: <Crown className="h-3.5 w-3.5" />,
  manager: <ShieldCheck className="h-3.5 w-3.5" />,
  kitchen: <ChefHat className="h-3.5 w-3.5" />,
  cashier: <CreditCard className="h-3.5 w-3.5" />,
  viewer: <User2 className="h-3.5 w-3.5" />,
};

const dateLocales: Record<string, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  vi: 'vi-VN',
};

const EMPTY_VALUE = '\u2014';

export function StaffListTable({ staff, onInvite, onEdit, selectedId }: StaffListTableProps) {
  const t = useTranslations('staff');
  const locale = useLocale();
  const dateLocale = dateLocales[locale] ?? 'vi-VN';

  return (
    <div className="space-y-4" data-testid="staff-list-table">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{t('table.title', { count: staff.length })}</h2>
        {onInvite ? (
          <button type="button" onClick={onInvite} className="btn-primary text-sm">
            {t('invite.action')}
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['member', 'role', 'permissions', 'status', 'joined'].map(column => (
                <th key={column} className="px-2 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t(`table.columns.${column}`)}
                </th>
              ))}
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                  {t('table.empty')}
                </td>
              </tr>
            ) : null}
            {staff.map((member) => {
              const activityDate = member.lastActive ?? member.joinedAt;
              return (
              <tr
                key={member.id}
                className={cn(
                  'border-b border-gray-100 transition-colors hover:bg-gray-50',
                  selectedId === member.id && 'bg-brand-50',
                )}
              >
                <td className="px-2 py-3">
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
                <td className="px-2 py-3">
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                    member.role === 'owner' ? 'bg-amber-50 text-amber-700'
                      : member.role === 'manager' ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-700',
                  )}>
                    {roleIcons[member.role]}
                    {t(`roles.${member.role}`)}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <div className="flex flex-wrap gap-0.5">
                    {member.permissions.slice(0, 3).map(permission => (
                      <span key={permission} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {t(`capabilities.${permission}`)}
                      </span>
                    ))}
                    {member.permissions.length > 3 ? <span className="text-xs text-gray-400">+{member.permissions.length - 3}</span> : null}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    member.isActive === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700',
                  )}>
                    {member.isActive === false ? t('status.blocked') : t('status.active')}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs text-gray-500">
                  {activityDate ? new Date(activityDate).toLocaleDateString(dateLocale) : EMPTY_VALUE}
                </td>
                <td className="px-2 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit?.(member.id)}
                    className="btn-ghost p-1"
                    aria-label={t('table.editMember', { name: member.name })}
                    aria-pressed={selectedId === member.id}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
