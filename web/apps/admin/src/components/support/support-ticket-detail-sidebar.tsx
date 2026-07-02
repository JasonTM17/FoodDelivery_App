'use client';

import { Clock, ShoppingBag, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/navigation';
import { formatDate } from '@/lib/utils';
import type { TicketDetail } from './support-ticket-detail-types';

interface SupportTicketDetailSidebarProps {
  ticket: TicketDetail;
  statusLabel: string;
  copy: {
    userInfo: string;
    order: string;
    ticketDetails: string;
    statusLabel: string;
    createdAt: string;
    assignee: string;
    unassigned: string;
    slaOverdue: string;
    initialDescription: string;
  };
}

export default function SupportTicketDetailSidebar({
  ticket,
  statusLabel,
  copy,
}: SupportTicketDetailSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{copy.userInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{ticket.userName}</p>
              <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
            </div>
          </div>
          {ticket.orderId ? (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span>
                  {copy.order}:{' '}
                  <Link href={`/orders/${ticket.orderId}`} className="text-primary hover:underline">
                    #{ticket.orderId}
                  </Link>
                </span>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{copy.ticketDetails}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{copy.statusLabel}</span>
            <Badge variant="outline">{statusLabel}</Badge>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{copy.createdAt}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(ticket.createdAt)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{copy.assignee}</span>
            <span>{ticket.assignedToName || copy.unassigned}</span>
          </div>
          {ticket.slaOverdue ? (
            <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
              {copy.slaOverdue}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{copy.initialDescription}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
