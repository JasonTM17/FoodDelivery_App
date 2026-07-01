'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ThreadMessage {
  id: string;
  body: string;
  sender: { id: string; name: string; role: 'customer' | 'agent' };
  isInternalNote: boolean;
  attachments?: { name: string; url: string }[];
  createdAt: string;
}

interface TicketThreadProps {
  ticketId: string;
  className?: string;
}

export default function TicketThread({ ticketId, className }: TicketThreadProps) {
  const { data, isLoading } = useQuery<{ messages: ThreadMessage[] }>({
    queryKey: ['ticket-thread', ticketId],
    queryFn: () => apiGet(`/admin/support-tickets/${ticketId}/messages`),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const messages = data?.messages || [];

  return (
    <div className={cn('space-y-4', className)}>
      {messages.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Chưa có tin nhắn nào</p>
      ) : (
        messages.map((msg, i) => (
          <div key={msg.id}>
            {i > 0 && i < messages.length && <Separator className="my-4" />}
            <Card
              className={cn(
                'border',
                msg.isInternalNote
                  ? 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20'
                  : msg.sender.role === 'agent'
                  ? 'border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/10'
                  : 'border-muted'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {msg.sender.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{msg.sender.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {msg.sender.role === 'agent' ? '(Hỗ trợ viên)' : '(Khách hàng)'}
                      </span>
                      {msg.isInternalNote && (
                        <span className="rounded bg-yellow-200 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                          Ghi chú nội bộ
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {msg.body}
                    </div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.name}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline hover:no-underline"
                          >
                            {att.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
