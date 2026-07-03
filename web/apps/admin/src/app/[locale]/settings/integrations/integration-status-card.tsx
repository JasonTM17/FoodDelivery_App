import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type IntegrationStatus = 'configured' | 'not_configured' | 'unavailable';

interface IntegrationStatusCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: IntegrationStatus;
  statusLabel: string;
  detailLabel: string;
  detail: string;
}

export function IntegrationStatusCard({
  icon: Icon,
  title,
  description,
  status,
  statusLabel,
  detailLabel,
  detail,
}: IntegrationStatusCardProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <StatusBadge status={status} label={statusLabel} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {detailLabel}
          </p>
          <p className="mt-1 break-words text-sm font-medium">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, label }: { status: IntegrationStatus; label: string }) {
  if (status === 'configured') {
    return (
      <Badge className="shrink-0 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20">
        <span aria-hidden="true">●</span> {label}
      </Badge>
    );
  }

  if (status === 'unavailable') {
    return <Badge variant="destructive" className="shrink-0">{label}</Badge>;
  }

  return <Badge variant="secondary" className="shrink-0">{label}</Badge>;
}
