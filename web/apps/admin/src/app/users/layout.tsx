import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quản lý người dùng',
  description: 'Danh sách người dùng trong hệ thống FoodFlow — khách hàng, tài xế, chủ nhà hàng, admin',
  openGraph: {
    title: 'Quản lý người dùng | FoodFlow Admin',
    description: 'Danh sách người dùng trong hệ thống FoodFlow — khách hàng, tài xế, chủ nhà hàng, admin',
  },
  robots: { index: false, follow: false },
}

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
