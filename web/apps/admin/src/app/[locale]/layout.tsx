import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@foodflow/i18n';
import { RootLayoutClient } from '../root-layout-client';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Locale-scoped layout for the Admin app. The root provider resolves locale and
 * messages from this validated URL segment before the application shell renders.
 */
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!(locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <RootLayoutClient>{children}</RootLayoutClient>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
