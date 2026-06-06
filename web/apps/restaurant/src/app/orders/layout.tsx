import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quản lý đơn hàng',
  description: 'Quản lý đơn hàng nhà hàng trên FoodFlow — nhận đơn, cập nhật trạng thái, theo dõi thời gian thực',
}

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
