import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quản lý nhà hàng',
  description: 'Danh sách nhà hàng đối tác trên nền tảng FoodFlow — kích hoạt, khóa, xem chi tiết',
  openGraph: {
    title: 'Quản lý nhà hàng | FoodFlow Admin',
    description: 'Danh sách nhà hàng đối tác trên nền tảng FoodFlow — kích hoạt, khóa, xem chi tiết',
  },
  robots: { index: false, follow: false },
}

export default function RestaurantsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
