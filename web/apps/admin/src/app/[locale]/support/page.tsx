'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { timeSince } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@foodflow/ui/page-header';
import TicketPriorityBadge from '@/components/badges/ticket-priority-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
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
import { MessageSquare, UserCheck, CheckCircle, Archive, AlertCircle, Clock, User } from 'lucide-react';
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

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  open: { label: 'Mở', icon: MessageSquare, color: 'border-blue-500' },
  in_progress: { label: 'Đang xử lý', icon: UserCheck, color: 'border-orange-500' },
  resolved: { label: 'Đã giải quyết', icon: CheckCircle, color: 'border-green-500' },
  closed: { label: 'Đã đóng', icon: Archive, color: 'border-gray-500' },
};

const statusColumns = ['open', 'in_progress', 'resolved', 'closed'] as const;

export default function SupportPage() {
  const t = useTranslations('support');
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data, isLoading } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ['support-tickets'],
    queryFn: () => apiGet('/admin/support/tickets'),
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
    try {
      await apiPatch(`/admin/support/tickets/${selectedTicket.id}`, {
        status: newStatus,
        resolutionNotes: resolutionNotes,
      });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setDetailOpen(false);
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const assignToSelf = async (ticketId: string) => {
    await apiPatch(`/admin/support/tickets/${ticketId}`, {
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
                    <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                  </div>
                  <Badge variant="outline">{columnTickets.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 p-1">
                    {columnTickets.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        Không có ticket
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
                              {timeSince(ticket.createdAt)}
                            </span>
                          </div>
                          {ticket.orderId && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Đơn: #{ticket.orderId}
                            </p>
                          )}
                          {ticket.assignedTo && (
                            <Badge variant="outline" className="mt-1 text-[10px] py-0">
                              Đã nhận
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
            <DialogTitle>Chi tiết yêu cầu</DialogTitle>
            <DialogDescription>
              {selectedTicket && `#${selectedTicket.id.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedTicket.issueType}</span>
                  <TicketPriorityBadge priority={selectedTicket.priority} />
                </div>
                <Badge variant="outline">
                  {statusConfig[selectedTicket.status as keyof typeof statusConfig]?.label || selectedTicket.status}
                </Badge>
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Người dùng: </span>
                  <span>{selectedTicket.userName}</span>
                </div>
                {selectedTicket.orderId && (
                  <div>
                    <span className="text-muted-foreground">Đơn hàng: </span>
                    <span>#{selectedTicket.orderId}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Ngày tạo: </span>
                  <span>{timeSince(selectedTicket.createdAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Người xử lý: </span>
                  <span>{selectedTicket.assignedTo || 'Chưa phân công'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution">Ghi chú xử lý</Label>
                <Textarea
                  id="resolution"
                  placeholder="Nhập ghi chú xử lý..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketStatus">Trạng thái</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="ticketStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Mở</SelectItem>
                    <SelectItem value="in_progress">Đang xử lý</SelectItem>
                    <SelectItem value="resolved">Đã giải quyết</SelectItem>
                    <SelectItem value="closed">Đã đóng</SelectItem>
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
                Nhận xử lý
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Hủy
            </Button>
            <Button onClick={updateTicket}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
