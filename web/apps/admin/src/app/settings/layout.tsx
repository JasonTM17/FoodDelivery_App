import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cài đặt hệ thống',
  description: 'Cấu hình nền tảng FoodFlow — thông báo, bảo mật, dữ liệu',
  openGraph: {
    title: 'Cài đặt hệ thống | FoodFlow Admin',
    description: 'Cấu hình nền tảng FoodFlow',
  },
  robots: { index: false, follow: false },
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
