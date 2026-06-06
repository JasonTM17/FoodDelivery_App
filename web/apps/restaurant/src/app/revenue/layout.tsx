import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Doanh thu',
  description: 'Tổng quan doanh thu nhà hàng trên FoodFlow — biểu đồ, KPI, món bán chạy',
}

export default function RevenueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
