import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hỗ trợ',
  description: 'Quản lý yêu cầu hỗ trợ từ khách hàng — ticket, phân công, xử lý',
  openGraph: {
    title: 'Hỗ trợ | FoodFlow Admin',
    description: 'Quản lý yêu cầu hỗ trợ từ khách hàng — ticket, phân công, xử lý',
  },
  robots: { index: false, follow: false },
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
