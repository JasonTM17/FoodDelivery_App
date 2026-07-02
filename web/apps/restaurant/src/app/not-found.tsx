'use client';

import { ArrowLeft, Store } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

export default function NotFound() {
  const t = useTranslations('rootStates.notFound');

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100">
        <Store className="h-10 w-10 text-brand-600" aria-hidden="true" />
      </div>
      <p className="mb-2 text-6xl font-bold text-gray-300" aria-hidden="true">404</p>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">{t('title')}</h1>
      <p className="mb-8 max-w-md text-sm text-gray-500">{t('description')}</p>
      <Link href="/" className="btn-primary">
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        {t('backToDashboard')}
      </Link>
    </main>
  );
}
