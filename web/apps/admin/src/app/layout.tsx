import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { RootLayoutClient } from './root-layout-client'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: {
    template: '%s | FoodFlow Admin',
    default: 'FoodFlow Admin',
  },
  description: 'Hệ thống quản trị nền tảng giao đồ ăn FoodFlow — quản lý đơn hàng, nhà hàng, tài xế và người dùng',
  openGraph: {
    title: 'FoodFlow Admin',
    description: 'Hệ thống quản trị nền tảng giao đồ ăn FoodFlow',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FoodFlow Admin',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
