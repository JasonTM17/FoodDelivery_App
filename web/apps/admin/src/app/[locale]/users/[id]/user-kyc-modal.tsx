'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiGet, apiPost } from '@/lib/api';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

interface KycData {
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  rejectReason: string | null;
  documents: { idFront: string | null; idBack: string | null; selfie: string | null };
}

interface UserKycModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function KycStatusBadge({ status }: { status: string }) {
  if (status === 'verified')
    return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Đã xác minh</Badge>;
  if (status === 'rejected')
    return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Bị từ chối</Badge>;
  return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Chờ duyệt</Badge>;
}

export default function UserKycModal({ userId, open, onOpenChange }: UserKycModalProps) {
  const t = useTranslations('userDetail');
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: kyc, isLoading } = useQuery<KycData>({
    queryKey: ['user-kyc', userId],
    queryFn: () => apiGet<KycData>(`/admin/users/${userId}/kyc`),
    enabled: open,
  });

  const handleReview = async (action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      await apiPost(`/admin/users/${userId}/kyc/review`, {
        action,
        ...(action === 'reject' && { reason: rejectReason }),
      });
      queryClient.invalidateQueries({ queryKey: ['user-kyc', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      if (action === 'approve') onOpenChange(false);
    } catch (err) {
      console.error('KYC review failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('kycReview')}
          </DialogTitle>
          <DialogDescription>{t('kycReviewDesc')}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : kyc ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('kycStatus')}</span>
              <KycStatusBadge status={kyc.status} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['idFront', 'idBack', 'selfie'] as const).map((doc) => (
                <div key={doc} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t(`kyc_${doc}`)}</p>
                  <div className="flex h-24 items-center justify-center rounded-lg bg-muted/50">
                    {kyc.documents[doc] ? (
                      <img src={kyc.documents[doc]!} alt={doc} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {kyc.rejectReason && (
              <>
                <Separator />
                <p className="text-xs text-destructive">{kyc.rejectReason}</p>
              </>
            )}
            {kyc.status === 'pending' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('kycRejectReason')}</Label>
                  <Textarea
                    placeholder={t('kycRejectReasonPlaceholder')}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleReview('reject')}
                    disabled={loading || !rejectReason.trim()}
                  >
                    <XCircle className="mr-2 h-4 w-4" />{t('kycReject')}
                  </Button>
                  <Button onClick={() => handleReview('approve')} disabled={loading}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />{t('kycApprove')}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('kycNoData')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
