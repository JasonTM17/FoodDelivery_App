'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';
import type { AdminKycPayload, AdminKycReviewRequest, AdminKycStatus } from '@foodflow/api-client';
import { apiGet, apiPost } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface UserKycModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const documentKeys = ['idFront', 'idBack', 'selfie'] as const;
type KycDocumentKey = (typeof documentKeys)[number];
type KycDocuments = Record<KycDocumentKey, string | null>;

function normalizeDocumentUrls(documentUrls: Record<string, unknown> | null | undefined): KycDocuments {
  return documentKeys.reduce((documents, key) => {
    const value = documentUrls?.[key];
    documents[key] = typeof value === 'string' && value.length > 0 ? value : null;
    return documents;
  }, {} as KycDocuments);
}

function kycStatusLabelKey(status: AdminKycStatus) {
  return status === 'approved' ? 'verified' : status;
}

function KycStatusBadge({ status, label }: { status: AdminKycStatus; label: string }) {
  if (status === 'approved') {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
        <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
        {label}
      </Badge>
    );
  }

  if (status === 'rejected') {
    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" aria-hidden="true" />
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export default function UserKycModal({ userId, open, onOpenChange }: UserKycModalProps) {
  const t = useTranslations('userDetail');
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const { data: kyc, isLoading } = useQuery<AdminKycPayload>({
    queryKey: ['user-kyc', userId],
    queryFn: () => apiGet<AdminKycPayload>(`/admin/users/${userId}/kyc`),
    enabled: open,
  });
  const activeSubmission = kyc?.available ? kyc.submissions?.[0] ?? null : null;
  const documents = normalizeDocumentUrls(activeSubmission?.documentUrls);

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!activeSubmission) return;
    setLoading(true);
    setReviewError('');
    try {
      const payload: AdminKycReviewRequest = {
        submissionId: activeSubmission.id,
        status: action === 'approve' ? 'approved' : 'rejected',
        ...(action === 'reject' && { reason: rejectReason.trim() }),
      };
      await apiPost(`/admin/users/${userId}/kyc/review`, payload);
      queryClient.invalidateQueries({ queryKey: ['user-kyc', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      if (action === 'approve') onOpenChange(false);
    } catch {
      setReviewError(t('kycReviewError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {t('kycReview')}
          </DialogTitle>
          <DialogDescription>{t('kycReviewDesc')}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div role="status" aria-label={t('kycLoading')} className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : activeSubmission ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('kycStatus')}</span>
              <KycStatusBadge
                status={activeSubmission.status}
                label={t(`kycStatuses.${kycStatusLabelKey(activeSubmission.status)}`)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {documentKeys.map((documentKey) => (
                <div key={documentKey} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t(`kycDocuments.${documentKey}`)}</p>
                  <div className="flex h-24 items-center justify-center rounded-lg bg-muted/50">
                    {documents[documentKey] ? (
                      <div
                        role="img"
                        aria-label={t('kycDocumentPreview', { document: t(`kycDocuments.${documentKey}`) })}
                        className="h-full w-full rounded-lg bg-cover bg-center"
                        style={{ backgroundImage: `url(${JSON.stringify(documents[documentKey])})` }}
                      />
                    ) : (
                      <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {activeSubmission.rejectionReason && (
              <>
                <Separator />
                <p className="text-xs text-destructive">{activeSubmission.rejectionReason}</p>
              </>
            )}
            {reviewError && (
              <p role="alert" className="text-sm text-destructive">{reviewError}</p>
            )}
            {activeSubmission.status === 'pending' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="kyc-reject-reason">{t('kycRejectReason')}</Label>
                  <Textarea
                    id="kyc-reject-reason"
                    placeholder={t('kycRejectReasonPlaceholder')}
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    rows={2}
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleReview('reject')}
                    disabled={loading || !rejectReason.trim()}
                  >
                    <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t('kycReject')}
                  </Button>
                  <Button onClick={() => handleReview('approve')} disabled={loading}>
                    <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t('kycApprove')}
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
