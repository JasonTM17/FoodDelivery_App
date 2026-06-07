import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nhật ký hệ thống',
  description: 'Lịch sử hoạt động của admin trên hệ thống FoodFlow — audit log',
  openGraph: {
    title: 'Nhật ký hệ thống | FoodFlow Admin',
    description: 'Lịch sử hoạt động của admin trên hệ thống FoodFlow — audit log',
  },
  robots: { index: false, follow: false },
}

export default function LogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
