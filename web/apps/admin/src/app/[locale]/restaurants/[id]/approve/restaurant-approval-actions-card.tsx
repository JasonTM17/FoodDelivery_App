'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RestaurantApprovalActionsCardProps {
  approvalError: string;
  loading: boolean;
  rejectReason: string;
  onApprove: () => void;
  onReject: () => void;
  onRejectReasonChange: (value: string) => void;
}

export function RestaurantApprovalActionsCard({
  approvalError,
  loading,
  rejectReason,
  onApprove,
  onReject,
  onRejectReasonChange,
}: RestaurantApprovalActionsCardProps) {
  const t = useTranslations('restaurantApprove');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('approvalActions')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {approvalError && (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {approvalError}
          </div>
        )}
        <div className="flex gap-3">
          <Button onClick={onApprove} disabled={loading} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {t('approve')}
          </Button>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="rejectReason">{t('rejectReason')}</Label>
          <Textarea
            id="rejectReason"
            placeholder={t('rejectReasonPlaceholder')}
            value={rejectReason}
            onChange={(event) => onRejectReasonChange(event.target.value)}
            rows={3}
          />
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={loading || !rejectReason.trim()}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            {t('reject')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
