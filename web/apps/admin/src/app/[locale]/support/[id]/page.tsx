'use client';

import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import TicketThread from '@/components/support/ticket-thread';
import TicketStatusPicker from '@/components/support/ticket-status-picker';
import TicketPriorityBadge from '@/components/support/ticket-priority-badge';
import { ArrowLeft, Send, User, Clock, ShoppingBag } from 'lucide-react';
import { Link } from '@/navigation';

interface TicketDetail {
  id: string;
  issueType: string;
  subject: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId?: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: string;
  assignedTo: string | null;
  assignedToName: string | null;
  tags: string[];
  createdAt: string;
  slaPercentRemaining: number;
  slaOverdue: boolean;
}

export default function SupportTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
      setReplyError((err as { message?: string }).message || 'Không thể gửi phản hồi');
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
        <p className="text-destructive">Không tìm thấy yêu cầu hỗ trợ</p>
        <Button asChild><Link href="/support">Quay lại</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Hỗ trợ', href: '/support' },
          { label: `#${ticket.id.slice(0, 8)}` },
        ]}
        title={ticket.subject || ticket.issueType}
        description={`#${ticket.id.slice(0, 8)} — ${formatDate(ticket.createdAt)}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/support">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
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

          <Card>
            <CardContent className="p-4">
              <Textarea
                placeholder="Nhập phản hồi..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Hỗ trợ Markdown</span>
                <Button onClick={sendReply} disabled={!replyText.trim() || replying}>
                  <Send className="mr-2 h-4 w-4" />
                  {replying ? 'Đang gửi...' : 'Gửi'}
                </Button>
              </div>
              {replyError && <p className="mt-2 text-sm text-destructive">{replyError}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin người dùng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{ticket.userName}</p>
                  <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
                </div>
              </div>
              {ticket.orderId && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span>Đơn hàng: <Link href={`/orders/${ticket.orderId}`} className="text-primary hover:underline">#{ticket.orderId}</Link></span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chi tiết ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái</span>
                <Badge variant="outline">{ticket.status === 'open' ? 'Mở' : ticket.status === 'in_progress' ? 'Đang xử lý' : ticket.status === 'resolved' ? 'Đã giải quyết' : 'Đã đóng'}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày tạo</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Người xử lý</span>
                <span>{ticket.assignedToName || 'Chưa phân công'}</span>
              </div>
              {ticket.slaOverdue && (
                <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
                  SLA đã quá hạn
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mô tả ban đầu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
