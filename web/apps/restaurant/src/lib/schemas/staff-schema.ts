import type { StaffRole, StaffCapability } from '@/lib/types';

export interface StaffInvitePayload {
  emails: string[];
  role: StaffRole;
}

export function validateStaffInvite(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const obj = data as Record<string, unknown>;

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Dữ liệu không hợp lệ'] };
  }

  if (!Array.isArray(obj.emails) || obj.emails.length === 0) {
    errors.push('Phải có ít nhất 1 email');
  } else {
    for (const email of obj.emails) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Email không hợp lệ: ${email}`);
      }
    }
  }

  const validRoles: StaffRole[] = ['owner', 'manager', 'kitchen', 'cashier', 'viewer'];
  if (!validRoles.includes(obj.role as StaffRole)) {
    errors.push('Vai trò không hợp lệ');
  }

  return { valid: errors.length === 0, errors };
}

export function validateStaffPermissions(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const obj = data as Record<string, unknown>;

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Dữ liệu không hợp lệ'] };
  }

  const validRoles: StaffRole[] = ['owner', 'manager', 'kitchen', 'cashier', 'viewer'];
  if (!validRoles.includes(obj.role as StaffRole)) {
    errors.push('Vai trò không hợp lệ');
  }

  const validCaps: StaffCapability[] = ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'];
  if (!Array.isArray(obj.permissions) || obj.permissions.length === 0) {
    errors.push('Phải có ít nhất 1 quyền');
  } else {
    for (const cap of obj.permissions) {
      if (!validCaps.includes(cap as StaffCapability)) {
        errors.push(`Quyền không hợp lệ: ${cap}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
