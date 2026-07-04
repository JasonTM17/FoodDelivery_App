'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  PageHeader as SharedPageHeader,
  type PageHeaderProps,
} from '@foodflow/ui/page-header';

const supportedLocales = ['vi', 'en', 'ja'] as const;

function localizeHref(href: string, locale: string): string {
  if (!href.startsWith('/') || supportedLocales.some(candidate => href === `/${candidate}` || href.startsWith(`/${candidate}/`))) {
    return href;
  }
  return href === '/' ? `/${locale}/overview` : `/${locale}${href}`;
}

export function PageHeader({ breadcrumbs, ...props }: PageHeaderProps) {
  const locale = useLocale();
  const t = useTranslations('common');
  const localizedBreadcrumbs = breadcrumbs.map(item => ({
    ...item,
    label: localizeLegacyBreadcrumbLabel(item.label, t),
    href: item.href ? localizeHref(item.href, locale) : undefined,
  }));

  return (
    <SharedPageHeader
      {...props}
      breadcrumbs={localizedBreadcrumbs}
      breadcrumbLabel={t('breadcrumb')}
      homeHref={`/${locale}/overview`}
      homeLabel={t('home')}
    />
  );
}

function localizeLegacyBreadcrumbLabel(
  label: string,
  t: ReturnType<typeof useTranslations<'common'>>,
): string {
  if (label === 'Admin') return t('admin');
  if (label === 'Settings') return t('settings');
  return label;
}
