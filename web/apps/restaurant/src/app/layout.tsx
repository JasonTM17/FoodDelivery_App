import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { RootLayoutClient } from './root-layout-client'
import { NextIntlClientProvider } from 'next-intl'
import { cookies } from 'next/headers'
import { getSharedMessages } from '@foodflow/i18n'
import type { Locale } from '@foodflow/i18n'
import viMessages from '../../messages/vi.json'
import enMessages from '../../messages/en.json'
import jaMessages from '../../messages/ja.json'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

const LOCALES = ['vi', 'en', 'ja'] as const
const appMessages = { vi: viMessages, en: enMessages, ja: jaMessages }

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
  twitter: { card: 'summary', title: 'FoodFlow Nhà hàng' },
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
