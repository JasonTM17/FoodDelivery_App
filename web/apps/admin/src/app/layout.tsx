import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { RootLayoutClient } from './root-layout-client'
import { NextIntlClientProvider } from 'next-intl'
import { cookies } from 'next/headers'
import { getSharedMessages } from '@foodflow/i18n'
import type { Locale } from '@foodflow/i18n'
import viMessages from '../../messages/vi.json'
import enMessages from '../../messages/en.json'
import jaMessages from '../../messages/ja.json'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

const LOCALES = ['vi', 'en', 'ja'] as const
const appMessages = { vi: viMessages, en: enMessages, ja: jaMessages }

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

  const messages = {
    ...getSharedMessages(locale),
    ...appMessages[locale],
  }

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RootLayoutClient>{children}</RootLayoutClient>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
