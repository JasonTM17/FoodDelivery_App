import type { StaffCapability, StaffRole } from './types';

export const STAFF_CAPABILITIES: StaffCapability[] = [
  'orders',
  'menu',
  'reports',
  'settings',
  'staff',
  'promotions',
];

export const DEFAULT_STAFF_PERMISSIONS: Record<StaffRole, StaffCapability[]> = {
  owner: [...STAFF_CAPABILITIES],
  manager: [...STAFF_CAPABILITIES],
  kitchen: ['orders'],
  cashier: ['orders'],
  viewer: ['reports'],
};

/** Nav path → required capability. `null` = always visible when authenticated. */
export const NAV_CAPABILITY_MAP: Record<string, StaffCapability | null> = {
  '/': null,
  '/orders': 'orders',
  '/menu': 'menu',
  '/promotions': 'promotions',
  '/analytics': 'reports',
  '/insights': 'reports',
  '/staff': 'staff',
  '/revenue': 'reports',
  '/reviews': 'reports',
  '/notifications': null,
  '/settings': 'settings',
  '/settings/profile': 'settings',
  '/settings/hours': 'settings',
};

export function resolveStaffPermissions(
  role?: StaffRole | string | null,
  permissions?: StaffCapability[] | string[] | null,
): StaffCapability[] {
  if (Array.isArray(permissions) && permissions.length > 0) {
    return permissions.filter((cap): cap is StaffCapability =>
      STAFF_CAPABILITIES.includes(cap as StaffCapability),
    );
  }
  if (role && role in DEFAULT_STAFF_PERMISSIONS) {
    return [...DEFAULT_STAFF_PERMISSIONS[role as StaffRole]];
  }
  // Unknown role/empty membership: deny elevated areas by default (orders only).
  return ['orders'];
}

export function hasCapability(
  permissions: StaffCapability[],
  capability: StaffCapability | null | undefined,
): boolean {
  if (!capability) return true;
  return permissions.includes(capability);
}

export function canAccessPath(permissions: StaffCapability[], href: string): boolean {
  const normalized = href.split('?')[0] || '/';
  if (normalized in NAV_CAPABILITY_MAP) {
    return hasCapability(permissions, NAV_CAPABILITY_MAP[normalized]);
  }
  // Prefix match for nested routes (e.g. /menu/new, /orders/123)
  const match = Object.keys(NAV_CAPABILITY_MAP)
    .filter((key) => key !== '/' && normalized.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  if (match) {
    return hasCapability(permissions, NAV_CAPABILITY_MAP[match]);
  }
  return true;
}
