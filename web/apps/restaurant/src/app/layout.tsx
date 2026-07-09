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
import { resolveRestaurantMetadataBase } from '@/lib/metadata-url'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

const LOCALES = ['vi', 'en', 'ja'] as const
const appMessages = { vi: viMessages, en: enMessages, ja: jaMessages }

export const metadata: Metadata = {
  metadataBase: resolveRestaurantMetadataBase(),
  title: {
    template: '%s | FoodFlow Restaurant',
    default: 'FoodFlow Restaurant',
  },
  description: 'FoodFlow merchant workspace for orders, menu, promotions, revenue, staff, insights, and customer replies',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/foodflow-mark.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
  },
  openGraph: {
    title: 'FoodFlow Restaurant',
    description: 'FoodFlow merchant workspace',
    type: 'website',
    images: [{ url: '/foodflow-mark.svg', width: 512, height: 512, alt: 'FoodFlow Restaurant mark' }],
  },
  twitter: { card: 'summary', title: 'FoodFlow Restaurant', images: ['/foodflow-mark.svg'] },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? 'vi'
  const locale: Locale = (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'vi'

  // Full app messages at root: RestaurantSidebar lives outside [locale] layout
  // and must resolve sidebar.* keys (not only shared + rootStates).
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
