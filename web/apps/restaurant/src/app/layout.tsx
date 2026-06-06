import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { RootLayoutClient } from './root-layout-client'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: {
    template: '%s | FoodFlow Nhà hàng',
    default: 'FoodFlow Nhà hàng',
  },
  description: 'Hệ thống quản lý nhà hàng FoodFlow — quản lý đơn hàng, thực đơn, doanh thu nhà hàng',
  openGraph: {
    title: 'FoodFlow Nhà hàng',
    description: 'Hệ thống quản lý nhà hàng FoodFlow',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FoodFlow Nhà hàng',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
