import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cài đặt',
  description: 'Cài đặt thông tin nhà hàng trên FoodFlow — tên, địa chỉ, giờ hoạt động',
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
