'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Clock, Ticket } from 'lucide-react';
import { EmptyState } from '@foodflow/ui/empty-state';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrder: number;
  maxDiscount: number;
  validUntil: string;
  usedAt: string | null;
  orderCode?: string;
}

interface VouchersData {
  owned: Voucher[];
  used: Voucher[];
  totalSaved: number;
}

export default function UserVouchersPanel({ userId }: { userId: string }) {
  const t = useTranslations('userVouchersPanel');
  const { data, isLoading } = useQuery<VouchersData>({
    queryKey: ['user-vouchers', userId],
    queryFn: () => apiGet<VouchersData>(`/admin/users/${userId}/vouchers`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={Ticket}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{t('totalSaved')}</span>
        <span className="font-bold text-green-600">{formatCurrency(data.totalSaved)}</span>
      </div>

      {data.owned.length === 0 && data.used.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={t('emptyTitle')}
          description={t('emptyAllDescription')}
        />
      ) : (
        <>
          {data.owned.length > 0 && (
            <VoucherSection title={t('ownedTitle', { count: data.owned.length })}>
              {data.owned.map((voucher) => (
                <VoucherCard key={voucher.id} voucher={voucher} state="owned" />
              ))}
            </VoucherSection>
          )}

          {data.used.length > 0 && (
            <VoucherSection title={t('usedTitle', { count: data.used.length })} muted>
              {data.used.map((voucher) => (
                <VoucherCard key={voucher.id} voucher={voucher} state="used" />
              ))}
            </VoucherSection>
          )}
        </>
      )}
    </div>
  );
}

function VoucherSection({
  title,
  children,
  muted,
}: {
  title: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <div>
      <h3 className={`mb-3 text-sm font-semibold ${muted ? 'text-muted-foreground' : ''}`}>
        {title}
      </h3>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

function VoucherCard({ voucher, state }: { voucher: Voucher; state: 'owned' | 'used' }) {
  const t = useTranslations('userVouchersPanel');
  const isUsed = state === 'used';

  return (
    <Card className={isUsed ? 'opacity-60' : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold ${isUsed ? 'line-through' : ''}`}>
                {voucher.code}
              </span>
              <Badge variant={isUsed ? 'secondary' : 'success'} className="text-[10px]">
                {isUsed ? t('usedBadge') : t('availableBadge')}
              </Badge>
            </div>

            {!isUsed && (
              <>
                <p className="mt-1 text-xs text-muted-foreground">{voucher.description}</p>
                <p className="mt-1 text-xs">
                  <VoucherDiscountText voucher={voucher} />
                </p>
              </>
            )}

            {isUsed && voucher.orderCode && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('orderCode', { orderCode: voucher.orderCode })}
              </p>
            )}
            {isUsed && voucher.usedAt && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t('usedAt', { date: formatDate(voucher.usedAt) })}
              </p>
            )}
          </div>
        </div>

        {!isUsed && voucher.validUntil && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t('validUntil', { date: formatDate(voucher.validUntil) })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VoucherDiscountText({ voucher }: { voucher: Voucher }) {
  const t = useTranslations('userVouchersPanel');
  const discount =
    voucher.discountType === 'percentage'
      ? t('percentageDiscount', { value: voucher.discountValue })
      : formatCurrency(voucher.discountValue);

  return (
    <>
      {t('discount', { discount })}
      {voucher.minOrder > 0 && ` ${t('minOrder', { amount: formatCurrency(voucher.minOrder) })}`}
      {voucher.maxDiscount > 0 && ` · ${t('maxDiscount', { amount: formatCurrency(voucher.maxDiscount) })}`}
    </>
  );
}
