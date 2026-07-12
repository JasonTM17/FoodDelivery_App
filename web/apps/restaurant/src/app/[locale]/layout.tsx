import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@foodflow/i18n';
import { RootLayoutClient } from '../root-layout-client';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Locale-scoped layout for restaurant app.
 * The root provider resolves its locale from the request URL. Keeping the
 * application shell here ensures locale validation happens before it renders.
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

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;

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
