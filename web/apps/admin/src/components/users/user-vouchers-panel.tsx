'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Ticket, Clock } from 'lucide-react';

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
    return <EmptyState icon={Ticket} title="Không có voucher" description="Người dùng chưa có voucher nào" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Tổng tiết kiệm:</span>
        <span className="font-bold text-green-600">{formatCurrency(data.totalSaved)}</span>
      </div>

      {data.owned.length === 0 && data.used.length === 0 ? (
        <EmptyState icon={Ticket} title="Không có voucher" description="Người dùng chưa nhận hoặc sử dụng voucher nào" />
      ) : (
        <>
          {data.owned.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold">Voucher đang có ({data.owned.length})</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {data.owned.map((v) => (
                  <Card key={v.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{v.code}</span>
                            <Badge variant="success" className="text-[10px]">Khả dụng</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                          <p className="mt-1 text-xs">
                            Giảm {v.discountType === 'percentage' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                            {v.minOrder > 0 && ` cho đơn từ ${formatCurrency(v.minOrder)}`}
                            {v.maxDiscount > 0 && ` · Tối đa ${formatCurrency(v.maxDiscount)}`}
                          </p>
                        </div>
                      </div>
                      {v.validUntil && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          HSD: {formatDate(v.validUntil)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {data.used.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Đã sử dụng ({data.used.length})</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {data.used.map((v) => (
                  <Card key={v.id} className="opacity-60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold line-through">{v.code}</span>
                            <Badge variant="secondary" className="text-[10px]">Đã dùng</Badge>
                          </div>
                          {v.orderCode && (
                            <p className="mt-1 text-xs text-muted-foreground">Đơn: {v.orderCode}</p>
                          )}
                          {v.usedAt && (
                            <p className="mt-1 text-[11px] text-muted-foreground">Dùng lúc: {formatDate(v.usedAt)}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
