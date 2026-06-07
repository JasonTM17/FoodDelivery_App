import type { I18nService } from 'nestjs-i18n'
import type { Locale } from './order-status.constant'

export const ROLES = {
  CUSTOMER: 'customer',
  DRIVER: 'driver',
  RESTAURANT: 'restaurant',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<string, string> = {
  customer: 'Khách hàng',
  driver: 'Tài xế',
  restaurant: 'Nhà hàng',
  admin: 'Quản trị viên',
}

export function getRoleLabel(
  role: string,
  lang: Locale = 'vi',
  i18n?: I18nService,
): string {
  if (i18n) {
    try {
      return i18n.t(`constants.role.${role}`, { lang }) as string
    } catch {
      // fall through to static map
    }
  }
  return ROLE_LABELS[role] ?? role
}
