import type { Metadata } from 'next';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { getSharedMessages, type Locale } from '@foodflow/i18n';
import viMessages from '../../messages/vi.json';
import enMessages from '../../messages/en.json';
import jaMessages from '../../messages/ja.json';
import { resolveAdminMetadataBase } from '@/lib/metadata-url';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

const LOCALES = ['vi', 'en', 'ja'] as const;
const appMessages = {
  vi: viMessages,
  en: enMessages,
  ja: jaMessages,
} as const;

export const metadata: Metadata = {
  metadataBase: resolveAdminMetadataBase(),
  title: {
    template: '%s | FoodFlow Admin',
    default: 'FoodFlow Admin',
  },
  description: 'FoodFlow delivery operations console for orders, restaurants, drivers, and users',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/foodflow-mark.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
  },
  openGraph: {
    title: 'FoodFlow Admin',
    description: 'FoodFlow delivery operations console',
    type: 'website',
    images: [{ url: '/foodflow-mark.svg', width: 512, height: 512, alt: 'FoodFlow Admin mark' }],
  },
  twitter: { card: 'summary', title: 'FoodFlow Admin', images: ['/foodflow-mark.svg'] },
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? 'vi';
  const locale: Locale = (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'vi';
  const messages = {
    ...getSharedMessages(locale),
    ...appMessages[locale],
  };

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
