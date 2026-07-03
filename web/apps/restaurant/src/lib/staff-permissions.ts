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
