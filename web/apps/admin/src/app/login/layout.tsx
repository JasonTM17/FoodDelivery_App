import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào hệ thống quản trị FoodFlow',
  openGraph: {
    title: 'Đăng nhập | FoodFlow Admin',
    description: 'Đăng nhập vào hệ thống quản trị FoodFlow',
  },
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
