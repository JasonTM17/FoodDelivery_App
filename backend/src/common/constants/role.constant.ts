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
