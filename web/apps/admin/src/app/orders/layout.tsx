import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quản lý đơn hàng',
  description: 'Xem và quản lý tất cả đơn hàng trong hệ thống FoodFlow — lọc, tìm kiếm, cập nhật trạng thái',
  openGraph: {
    title: 'Quản lý đơn hàng | FoodFlow Admin',
    description: 'Xem và quản lý tất cả đơn hàng trong hệ thống FoodFlow — lọc, tìm kiếm, cập nhật trạng thái',
  },
  robots: { index: false, follow: false },
}

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
