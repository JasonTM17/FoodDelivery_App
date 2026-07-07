'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

type BadgeVariant = 'default' | 'secondary' | 'destructive';

interface UserDetailSummaryCardsProps {
  user: {
    status: 'active' | 'banned';
    totalOrders: number | null;
    totalSpent: number | null;
    kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  };
  onOpenKyc: () => void;
}

const KYC_BADGE: Record<string, BadgeVariant> = {
  none: 'secondary',
  pending: 'secondary',
  verified: 'default',
  rejected: 'destructive',
};

export function UserDetailSummaryCards({ user, onOpenKyc }: UserDetailSummaryCardsProps) {
  const t = useTranslations('userDetail');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('stats')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('statusLabel')}</span>
            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
              {user.status === 'active' ? t('statusActive') : t('statusBanned')}
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('totalOrders')}</span>
            <span className="font-medium">{user.totalOrders ?? '—'}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('totalSpent')}</span>
            <span className="font-medium">
              {user.totalSpent === null ? '—' : formatCurrency(user.totalSpent)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t('kycCard')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('kycStatus')}</span>
            <Badge variant={KYC_BADGE[user.kycStatus] ?? 'secondary'}>{user.kycStatus}</Badge>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={onOpenKyc}>
            {t('kycViewDocs')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
