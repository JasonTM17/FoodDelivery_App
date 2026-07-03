import { Prisma } from '@prisma/client'

export const STAFF_CAPABILITIES = ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'] as const

export function normalizeStaffCapabilities(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (capability): capability is typeof STAFF_CAPABILITIES[number] => (
      typeof capability === 'string'
      && STAFF_CAPABILITIES.includes(capability as typeof STAFF_CAPABILITIES[number])
    ),
  )
}
