import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Phân tích',
  description: 'Phân tích hiệu quả kinh doanh nền tảng FoodFlow — GMV, đơn hàng, khách hàng',
  openGraph: {
    title: 'Phân tích | FoodFlow Admin',
    description: 'Phân tích hiệu quả kinh doanh nền tảng FoodFlow — GMV, đơn hàng, khách hàng',
  },
  robots: { index: false, follow: false },
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
