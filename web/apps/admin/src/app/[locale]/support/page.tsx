'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { timeSince } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/admin-page-header';
import TicketPriorityBadge from '@/components/badges/ticket-priority-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { MessageSquare, UserCheck, CheckCircle, Archive, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ticket {
  id: string;
  issueType: string;
  orderId: string;
  userId: string;
  userName: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
  assignedTo: string | null;
  resolutionNotes: string;
}

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  open: { icon: MessageSquare, color: 'border-blue-500' },
  in_progress: { icon: UserCheck, color: 'border-orange-500' },
  resolved: { icon: CheckCircle, color: 'border-green-500' },
  closed: { icon: Archive, color: 'border-gray-500' },
};

const statusColumns = ['open', 'in_progress', 'resolved', 'closed'] as const;

export default function SupportPage() {
  const locale = useLocale();
  const t = useTranslations('support');
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [mutationError, setMutationError] = useState('');

  const { data, isLoading } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ['support-tickets'],
    queryFn: () => apiGet('/admin/support-tickets'),
  });

  const tickets = data?.tickets || [];

  const openDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResolutionNotes(ticket.resolutionNotes || '');
    setNewStatus(ticket.status);
    setDetailOpen(true);
  };

  const updateTicket = async () => {
    if (!selectedTicket) return;
    setMutationError('');
    try {
      await apiPatch(`/admin/support-tickets/${selectedTicket.id}`, {
        status: newStatus,
        resolutionNotes: resolutionNotes,
      });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setDetailOpen(false);
    } catch (err) {
      setMutationError((err as { message?: string }).message || t('mutationError'));
    }
  };

  const assignToSelf = async (ticketId: string) => {
    setMutationError('');
    await apiPatch(`/admin/support-tickets/${ticketId}`, {
      status: 'in_progress',
      assignedTo: 'self',
    });
    queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusColumns.map((col) => {
          const config = statusConfig[col];
          const Icon = config.icon;
          const columnTickets = tickets.filter((t) => t.status === col);

          return (
            <Card key={col} className={cn('border-t-4', config.color)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <CardTitle className="text-sm font-medium">{t(`statuses.${col}`)}</CardTitle>
                  </div>
                  <Badge variant="outline">{columnTickets.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 p-1">
                    {columnTickets.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        {t('emptyColumn')}
                      </p>
                    ) : (
                      columnTickets.map((ticket) => (
                        <Button
                          key={ticket.id}
                          variant="ghost"
                          className="w-full h-auto rounded-lg border bg-card p-3 text-left justify-start font-normal transition-colors hover:bg-accent"
                          onClick={() => openDetail(ticket)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {ticket.issueType}
                              </p>
                              <p className="mt-1 text-[11px] text-muted-foreground truncate">
                                {ticket.description}
                              </p>
                            </div>
                            <TicketPriorityBadge priority={ticket.priority} />
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <User className="h-3 w-3" />
                              {ticket.userName}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {timeSince(ticket.createdAt, locale)}
                            </span>
                          </div>
                          {ticket.orderId && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {t('orderShort', { id: ticket.orderId })}
                            </p>
                          )}
                          {ticket.assignedTo && (
                            <Badge variant="outline" className="mt-1 text-[10px] py-0">
                              {t('assigned')}
                            </Badge>
                          )}
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('detailTitle')}</DialogTitle>
            <DialogDescription>
              {selectedTicket && `#${selectedTicket.id.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {mutationError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {mutationError}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedTicket.issueType}</span>
                  <TicketPriorityBadge priority={selectedTicket.priority} />
                </div>
                <Badge variant="outline">
                  {selectedTicket.status in statusConfig ? t(`statuses.${selectedTicket.status}`) : selectedTicket.status}
                </Badge>
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('userLabel')} </span>
                  <span>{selectedTicket.userName}</span>
                </div>
                {selectedTicket.orderId && (
                  <div>
                    <span className="text-muted-foreground">{t('orderLabel')} </span>
                    <span>#{selectedTicket.orderId}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">{t('createdAtLabel')} </span>
                  <span>{timeSince(selectedTicket.createdAt, locale)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('assigneeLabel')} </span>
                  <span>{selectedTicket.assignedTo || t('unassigned')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution">{t('resolutionNotes')}</Label>
                <Textarea
                  id="resolution"
                  placeholder={t('resolutionPlaceholder')}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketStatus">{t('statusLabel')}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="ticketStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusColumns.map((status) => (
                      <SelectItem key={status} value={status}>{t(`statuses.${status}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedTicket?.status === 'open' && !selectedTicket.assignedTo && (
              <Button
                variant="outline"
                onClick={() => {
                  assignToSelf(selectedTicket.id);
                  setDetailOpen(false);
                }}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {t('claim')}
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={updateTicket}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
