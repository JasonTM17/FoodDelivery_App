'use client';

import { DollarSign, Pencil, Percent, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { AdminPromotion } from './admin-promotions-types';

interface AdminPromotionsTableProps {
  promotions: AdminPromotion[];
  isError: boolean;
  isLoading: boolean;
  mutationError: string;
  onCreate: () => void;
  onDelete: (promotionId: string) => void;
  onEdit: (promotion: AdminPromotion) => void;
  onRetry: () => void;
  onToggle: (promotion: AdminPromotion) => void;
}

export function AdminPromotionsTable(props: AdminPromotionsTableProps) {
  const t = useTranslations('adminPromotionManagement');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sectionTitle')}</CardTitle>
        <CardDescription>
          {props.isLoading ? t('loading') : t('count', { count: props.promotions.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {props.mutationError && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {props.mutationError}
          </div>
        )}

        {props.isLoading ? (
          <div className="space-y-3" role="status" aria-label={t('loading')}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : props.isError ? (
          <EmptyState
            icon={Percent}
            title={t('loadError')}
            description={t('loadErrorDescription')}
            actionLabel={t('retry')}
            onAction={props.onRetry}
          />
        ) : props.promotions.length === 0 ? (
          <EmptyState
            icon={Percent}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            actionLabel={t('create')}
            onAction={props.onCreate}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {['code', 'type', 'value', 'usage', 'expiry', 'active'].map(key => (
                  <TableHead key={key}>{t(`columns.${key}`)}</TableHead>
                ))}
                <TableHead className="w-24 text-right">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.promotions.map(promotion => (
                <TableRow key={promotion.id}>
                  <TableCell className="font-mono font-medium">{promotion.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {promotion.type === 'percentage'
                        ? <Percent className="h-3 w-3" aria-hidden="true" />
                        : <DollarSign className="h-3 w-3" aria-hidden="true" />}
                      {t(`types.${promotion.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {promotion.type === 'percentage'
                      ? `${promotion.value}%`
                      : formatCurrency(promotion.value)}
                  </TableCell>
                  <TableCell>
                    {promotion.usageCount} / {promotion.usageLimit > 0 ? promotion.usageLimit : '∞'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {promotion.endDate ? formatDate(promotion.endDate) : t('noExpiry')}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={promotion.active}
                      onCheckedChange={() => props.onToggle(promotion)}
                      aria-label={t('toggleLabel', { code: promotion.code })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => props.onEdit(promotion)} aria-label={t('editLabel', { code: promotion.code })}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => props.onDelete(promotion.id)} className="text-destructive hover:text-destructive" aria-label={t('deleteLabel', { code: promotion.code })}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
