import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@foodflow/i18n';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

/**
 * Locale-scoped layout for restaurant app.
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

  setRequestLocale(locale);
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

export async function generateMetadata({
  params: { locale },
}: Pick<LocaleLayoutProps, 'params'>): Promise<Metadata> {
  if (!(locales as readonly string[]).includes(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      template: t('titleTemplate'),
      default: t('title'),
    },
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: t('title'),
      description: t('description'),
    },
  };
}
