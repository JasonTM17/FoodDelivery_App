'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { isHttpsUrl } from '@/lib/safe-url';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

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

interface TicketThreadResponse {
  messages: ThreadMessage[];
}

export default function TicketThread({ ticketId, className }: TicketThreadProps) {
  const t = useTranslations('support.thread');
  const query = useQuery<unknown>({
    queryKey: ['ticket-thread', ticketId],
    queryFn: () => apiGet(`/admin/support-tickets/${ticketId}/messages`),
    refetchInterval: 10000,
  });

  if (query.isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const response = parseTicketThreadResponse(query.data);
  const hasContractError =
    !query.isLoading && !query.isError && query.data !== undefined && response === null;
  const messages = response?.messages ?? [];

  if (query.isError || hasContractError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={query.isError ? t('loadErrorTitle') : t('contractErrorTitle')}
        description={query.isError ? t('loadErrorDescription') : t('contractErrorDescription')}
        actionLabel={t('retry')}
        onAction={() => void query.refetch()}
        className={cn('rounded-lg border border-destructive/20 bg-destructive/5', className)}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {messages.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
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
                        {msg.sender.role === 'agent' ? t('agentRole') : t('customerRole')}
                      </span>
                      {msg.isInternalNote && (
                        <span className="rounded bg-yellow-200 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                          {t('internalNote')}
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
                        {msg.attachments.map((att) =>
                          // B-WEB-12: allowlist https: only for attachment hrefs
                          isHttpsUrl(att.url) ? (
                            <a
                              key={att.name}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline hover:no-underline"
                            >
                              {att.name}
                            </a>
                          ) : (
                            <span
                              key={att.name}
                              className="text-xs text-muted-foreground"
                              title={t('unsafeAttachment')}
                            >
                              {att.name}
                            </span>
                          ),
                        )}
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

function parseTicketThreadResponse(value: unknown): TicketThreadResponse | null {
  if (!value || typeof value !== 'object') return null;
  const messages = (value as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return null;
  return { messages: messages as ThreadMessage[] };
}
