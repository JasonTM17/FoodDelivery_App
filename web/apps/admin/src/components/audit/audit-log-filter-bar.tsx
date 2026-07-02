'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import type { AuditLogFilters } from './audit-log-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface AuditLogFilterBarProps {
  value: AuditLogFilters;
  onChange: (value: AuditLogFilters) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function AuditLogFilterBar({ value, onChange, onSubmit, disabled }: AuditLogFilterBarProps) {
  const t = useTranslations('logs');
  const update = (field: keyof AuditLogFilters, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <Card>
      <CardContent className="pb-3 pt-4">
        <div className="flex flex-wrap gap-3">
          <Input
            aria-label={t('actorFilter')}
            placeholder={t('actorPlaceholder')}
            value={value.actor}
            onChange={event => update('actor', event.target.value)}
            className="w-52"
          />
          <Input
            aria-label={t('actionFilter')}
            placeholder={t('actionPlaceholder')}
            value={value.action}
            onChange={event => update('action', event.target.value)}
            className="w-48"
          />
          <Input
            aria-label={t('dateFrom')}
            type="date"
            value={value.dateFrom}
            onChange={event => update('dateFrom', event.target.value)}
            className="w-40"
          />
          <Input
            aria-label={t('dateTo')}
            type="date"
            value={value.dateTo}
            onChange={event => update('dateTo', event.target.value)}
            className="w-40"
          />
          <Button onClick={onSubmit} disabled={disabled}>
            <Search className="mr-2 h-4 w-4" />{t('search')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
