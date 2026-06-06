import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quản lý tài xế',
  description: 'Danh sách tài xế trong hệ thống FoodFlow — trạng thái, đánh giá, phương tiện',
  openGraph: {
    title: 'Quản lý tài xế | FoodFlow Admin',
    description: 'Danh sách tài xế trong hệ thống FoodFlow — trạng thái, đánh giá, phương tiện',
  },
  robots: { index: false, follow: false },
}

export default function DriversLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
