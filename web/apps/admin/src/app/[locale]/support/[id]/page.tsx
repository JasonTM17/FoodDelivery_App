'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TicketThread from '@/components/support/ticket-thread';
import TicketStatusPicker from '@/components/support/ticket-status-picker';
import TicketPriorityBadge from '@/components/support/ticket-priority-badge';
import SupportTicketDetailSidebar from '@/components/support/support-ticket-detail-sidebar';
import SupportTicketReplyComposer from '@/components/support/support-ticket-reply-composer';
import type { TicketDetail } from '@/components/support/support-ticket-detail-types';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('supportDetail');
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');

  const { data: ticket, isLoading } = useQuery<TicketDetail>({
    queryKey: ['support-ticket', id],
    queryFn: () => apiGet<TicketDetail>(`/admin/support-tickets/${id}`),
  });

  const sendReply = async () => {
    if (!replyText.trim() || !ticket) return;
    setReplying(true);
    setReplyError('');
    try {
      await apiPost(`/admin/support-tickets/${ticket.id}/replies`, { body: replyText });
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['support-ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-thread', id] });
    } catch (err) {
      setReplyError((err as { message?: string }).message || t('replyError'));
    } finally {
      setReplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{t('notFound')}</p>
        <Button asChild><Link href="/support">{t('back')}</Link></Button>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    open: t('status.open'),
    in_progress: t('status.inProgress'),
    resolved: t('status.resolved'),
    closed: t('status.closed'),
  };
  const statusLabel = statusLabels[ticket.status] ?? ticket.status;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbs.admin') },
          { label: t('breadcrumbs.support'), href: '/support' },
          { label: `#${ticket.id.slice(0, 8)}` },
        ]}
        title={ticket.subject || ticket.issueType}
        description={`#${ticket.id.slice(0, 8)} — ${formatDate(ticket.createdAt)}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/support">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TicketStatusPicker ticketId={ticket.id} currentStatus={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
                {ticket.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <TicketThread ticketId={ticket.id} />

          <SupportTicketReplyComposer
            value={replyText}
            replying={replying}
            error={replyError}
            copy={{
              placeholder: t('replyPlaceholder'),
              markdownSupported: t('markdownSupported'),
              send: t('send'),
              sending: t('sending'),
            }}
            onChange={setReplyText}
            onSend={sendReply}
          />
        </div>

        <SupportTicketDetailSidebar
          ticket={ticket}
          statusLabel={statusLabel}
          copy={{
            userInfo: t('userInfo'),
            order: t('order'),
            ticketDetails: t('ticketDetails'),
            statusLabel: t('statusLabel'),
            createdAt: t('createdAt'),
            assignee: t('assignee'),
            unassigned: t('unassigned'),
            slaOverdue: t('slaOverdue'),
            initialDescription: t('initialDescription'),
          }}
        />
      </div>
    </div>
  );
}
