import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@foodflow/i18n';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

/**
 * Locale-scoped layout for admin app.
 * Provides NextIntlClientProvider for all routes under /[locale]/.
 * Nested inside app/layout.tsx (HTML shell + RootLayoutClient).
 */
export default async function LocaleLayout({
  children,
  params: { locale },
}: LocaleLayoutProps) {
  if (!(locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
