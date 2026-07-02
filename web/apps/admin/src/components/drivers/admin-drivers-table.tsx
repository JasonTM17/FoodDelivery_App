'use client';

import type { AdminDriver } from '@foodflow/api-client';
import { Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdminDriversTableProps {
  drivers: AdminDriver[];
}

export function AdminDriversTable({ drivers }: AdminDriversTableProps) {
  const t = useTranslations('drivers');
  const locale = useLocale();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.driver')}</TableHead>
          <TableHead>{t('columns.phone')}</TableHead>
          <TableHead>{t('columns.vehicle')}</TableHead>
          <TableHead>{t('columns.rating')}</TableHead>
          <TableHead>{t('columns.deliveries')}</TableHead>
          <TableHead>{t('columns.status')}</TableHead>
          <TableHead>{t('columns.joinedAt')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drivers.map(driver => (
          <TableRow key={driver.id}>
            <TableCell>
              <p className="font-medium">{driver.name}</p>
              <p className="text-xs text-muted-foreground">{driver.email}</p>
            </TableCell>
            <TableCell>{driver.phone ?? '—'}</TableCell>
            <TableCell>
              <p>{t(`vehicleTypes.${driver.vehicleType}`)}</p>
              {driver.vehiclePlate && (
                <p className="text-xs text-muted-foreground">{driver.vehiclePlate}</p>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Star aria-hidden="true" className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{driver.rating.toFixed(1)}</span>
              </div>
            </TableCell>
            <TableCell>{driver.totalDeliveries}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(driver.status)}>
                {t(`statuses.${driver.status}`)}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatLocalizedDate(driver.createdAt, locale)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function formatLocalizedDate(dateString: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function statusVariant(status: AdminDriver['status']) {
  if (status === 'online') return 'success';
  if (status === 'delivering') return 'warning';
  return 'secondary';
}
