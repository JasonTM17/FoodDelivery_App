import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import type { Locale } from '@foodflow/i18n'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

const LOCALES = ['vi', 'en', 'ja'] as const

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
  twitter: { card: 'summary', title: 'FoodFlow Admin' },
  robots: { index: false, follow: false },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? 'vi'
  const locale: Locale = (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'vi'

  return (
    <html lang={locale}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
