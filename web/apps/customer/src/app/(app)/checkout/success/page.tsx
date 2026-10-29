'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@foodflow/ui';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-9 w-9 text-green-600" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-gray-900">{t('success.title')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('success.desc')}</p>
      {orderId && (
        <p className="text-xs text-muted-foreground">
          {t('success.orderId')} <span className="font-mono font-semibold text-gray-900">{orderId}</span>
        </p>
      )}
      <div className="flex gap-3 mt-2">
        {orderId && (
          <Button asChild>
            <Link href={`/orders/${orderId}`}>{t('success.viewOrder')}</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/home">{t('success.backHome')}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
