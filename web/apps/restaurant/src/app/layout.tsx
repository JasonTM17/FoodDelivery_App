import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { Inter } from 'next/font/google'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import { resolveRestaurantMetadataBase } from '@/lib/metadata-url'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

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
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
