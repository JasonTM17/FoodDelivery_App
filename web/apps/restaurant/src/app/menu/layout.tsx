import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quản lý menu',
  description: 'Quản lý thực đơn nhà hàng trên FoodFlow — thêm, sửa, ẩn món ăn',
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
