'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import PromotionForm from '@/components/promotions/promotion-form';
import {
  toPromotionFormValues,
  type AdminPromotion,
} from '@/components/promotions/admin-promotions-types';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { Link, useRouter } from '@/navigation';
import { PageHeader } from '@/components/layout/admin-page-header';

export default function EditPromotionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const promotionsT = useTranslations('promotions');
  const t = useTranslations('adminPromotionManagement');

  const { data: promotion, isError, isLoading, refetch } = useQuery<AdminPromotion>({
    queryKey: ['promotion', id],
    queryFn: () => apiGet<AdminPromotion>(`/admin/promotions/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label={t('loading')}>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (isError || !promotion) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{t('notFound')}</p>
        <div className="flex gap-2">
          {isError && <Button onClick={() => void refetch()}>{t('retry')}</Button>}
          <Button asChild variant="outline"><Link href="/promotions">{t('back')}</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: promotionsT('title'), href: '/promotions' },
          { label: promotion.code, href: `/promotions/${id}` },
          { label: t('editTitle') },
        ]}
        title={`${t('editTitle')}: ${promotion.code}`}
        description={t('editDescription')}
        actions={(
          <Button variant="ghost" size="sm" asChild>
            <Link href="/promotions">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('back')}
            </Link>
          </Button>
        )}
      />
      <PromotionForm
        defaultValues={toPromotionFormValues(promotion)}
        editId={id}
        onSuccess={() => router.push('/promotions')}
      />
    </div>
  );
}
