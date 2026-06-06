import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Khuyến mãi',
  description: 'Quản lý mã khuyến mãi và ưu đãi trên nền tảng FoodFlow',
  openGraph: {
    title: 'Khuyến mãi | FoodFlow Admin',
    description: 'Quản lý mã khuyến mãi và ưu đãi trên nền tảng FoodFlow',
  },
  robots: { index: false, follow: false },
}

export default function PromotionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
