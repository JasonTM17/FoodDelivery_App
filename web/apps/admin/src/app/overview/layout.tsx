import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tổng quan',
  description: 'Tổng quan hoạt động của hệ thống FoodFlow — doanh thu, đơn hàng, trạng thái',
  openGraph: {
    title: 'Tổng quan | FoodFlow Admin',
    description: 'Tổng quan hoạt động của hệ thống FoodFlow — doanh thu, đơn hàng, trạng thái',
  },
  robots: { index: false, follow: false },
}

export default function OverviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
