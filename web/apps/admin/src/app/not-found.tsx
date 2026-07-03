'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { defaultLocale } from '@foodflow/i18n';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Home } from 'lucide-react';

const LOCALES = new Set(['vi', 'en', 'ja']);

function getOverviewHref(pathname: string | null) {
  const segment = pathname?.split('/').filter(Boolean)[0];
  return segment && LOCALES.has(segment) ? `/${segment}/overview` : `/${defaultLocale}/overview`;
}

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('rootStates.notFound');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <FoodFlowLogo showWordmark={false} className="mb-6" markClassName="h-20 w-20" />
      <h1 className="mb-2 text-6xl font-bold text-muted-foreground/30">404</h1>
      <h2 className="mb-2 text-xl font-semibold">{t('title')}</h2>
      <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
        {t('description')}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('goBack')}
        </Button>
        <Button asChild>
          <Link href={getOverviewHref(pathname)}>
            <Home className="mr-2 h-4 w-4" />
            {t('goToOverview')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
