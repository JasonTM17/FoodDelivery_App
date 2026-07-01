'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import PromotionForm from '@/components/promotions/promotion-form';
import { PageHeader } from '@foodflow/ui/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/navigation';
import { useRouter } from '@/navigation';

interface PromotionDetail {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'shipping';
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageLimit: number;
  perUserLimit: number;
  audience: string;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  description: string;
}

export default function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: promo, isLoading } = useQuery<PromotionDetail>({
    queryKey: ['promotion', id],
    queryFn: () => apiGet<PromotionDetail>(`/admin/promotions/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Không tìm thấy khuyến mãi</p>
        <Button asChild><Link href="/promotions">Quay lại</Link></Button>
      </div>
    );
  }

  const defaultValues = {
    code: promo.code,
    name: promo.name || '',
    discountType: (promo.type === 'percentage' ? 'percent' : promo.type === 'fixed' ? 'fixed' : promo.type === 'bogo' ? 'bogo' : 'shipping') as 'percent' | 'fixed' | 'bogo' | 'shipping',
    discountValue: promo.value,
    minOrderVnd: promo.minOrder || 0,
    maxDiscountVnd: promo.maxDiscount || 0,
    audience: (promo.audience as 'all' | 'new' | 'vip' | 'segment') || 'all',
    perUserLimit: promo.perUserLimit || 1,
    maxUsage: promo.usageLimit > 0 ? promo.usageLimit : undefined,
    validFrom: promo.startDate ? new Date(promo.startDate) : undefined,
    validUntil: promo.endDate ? new Date(promo.endDate) : undefined,
    active: promo.active,
    description: promo.description || '',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Khuyến mãi', href: '/promotions' },
          { label: promo.code, href: `/promotions/${id}` },
          { label: 'Chỉnh sửa' },
        ]}
        title={`Chỉnh sửa: ${promo.code}`}
        description="Cập nhật thông tin mã khuyến mãi"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/promotions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
        }
      />
      <PromotionForm
        defaultValues={defaultValues}
        editId={id}
        onSuccess={() => router.push('/promotions')}
      />
    </div>
  );
}
