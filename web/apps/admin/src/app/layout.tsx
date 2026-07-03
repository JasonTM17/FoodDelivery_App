import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import type { Locale } from '@foodflow/i18n';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

const LOCALES = ['vi', 'en', 'ja'] as const;

export const metadata: Metadata = {
  title: {
    template: '%s | FoodFlow Admin',
    default: 'FoodFlow Admin',
  },
  description: 'FoodFlow delivery operations console for orders, restaurants, drivers, and users',
  openGraph: {
    title: 'FoodFlow Admin',
    description: 'FoodFlow delivery operations console',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'FoodFlow Admin' },
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? 'vi';
  const locale: Locale = (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : 'vi';

  return (
    <html lang={locale}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
