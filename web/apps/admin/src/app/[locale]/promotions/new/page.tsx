'use client';

import PromotionForm from '@/components/promotions/promotion-form';
import { PageHeader } from '@foodflow/ui/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/navigation';
import { useRouter } from '@/navigation';

export default function NewPromotionPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Khuyến mãi', href: '/promotions' },
          { label: 'Tạo mới' },
        ]}
        title="Tạo khuyến mãi mới"
        description="Thiết lập mã khuyến mãi mới cho người dùng"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/promotions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
        }
      />
      <PromotionForm onSuccess={() => router.push('/promotions')} />
    </div>
  );
}
