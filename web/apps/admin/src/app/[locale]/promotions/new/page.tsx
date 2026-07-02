'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import PromotionForm from '@/components/promotions/promotion-form';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/navigation';
import { PageHeader } from '@/components/layout/admin-page-header';

export default function NewPromotionPage() {
  const router = useRouter();
  const promotionsT = useTranslations('promotions');
  const t = useTranslations('adminPromotionManagement');

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: promotionsT('title'), href: '/promotions' },
          { label: t('createTitle') },
        ]}
        title={t('createTitle')}
        description={t('createDescription')}
        actions={(
          <Button variant="ghost" size="sm" asChild>
            <Link href="/promotions">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('back')}
            </Link>
          </Button>
        )}
      />
      <PromotionForm onSuccess={() => router.push('/promotions')} />
    </div>
  );
}
