'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { AuditLogEntry } from './audit-log-types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
}

const dateLocales: Record<string, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  vi: 'vi-VN',
};

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const t = useTranslations('logs');
  const locale = useLocale();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.timestamp')}</TableHead>
              <TableHead>{t('columns.admin')}</TableHead>
              <TableHead>{t('columns.action')}</TableHead>
              <TableHead>{t('columns.target')}</TableHead>
              <TableHead>{t('columns.id')}</TableHead>
              <TableHead>{t('columns.ip')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id} className="transition-colors hover:bg-muted/50">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString(dateLocales[locale] ?? 'vi-VN')}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{log.admin.fullName}</p>
                  <p className="text-xs text-muted-foreground">{log.admin.email}</p>
                </TableCell>
                <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                <TableCell>{log.targetType}</TableCell>
                <TableCell className="font-mono text-xs">
                  {log.targetId?.slice(0, 8) ?? '—'}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {log.ipAddress}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
