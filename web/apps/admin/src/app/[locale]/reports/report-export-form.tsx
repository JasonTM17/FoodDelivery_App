'use client';

import type { AdminExportFormat, AdminExportResource } from '@foodflow/api-client';
import { Download, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { datePresets, exportFormats, reportTypes, type AdminExportPeriod } from './report-export-config';

interface ReportExportFormProps {
  reportType: AdminExportResource;
  period: AdminExportPeriod;
  dateFrom: string;
  dateTo: string;
  format: AdminExportFormat;
  generating: boolean;
  error: string;
  onReportTypeChange: (value: AdminExportResource) => void;
  onPeriodChange: (value: AdminExportPeriod) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onFormatChange: (value: AdminExportFormat) => void;
  onGenerate: () => void;
}

export function ReportExportForm(props: ReportExportFormProps) {
  const t = useTranslations('reports');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          id="report-type"
          label={t('fields.reportType')}
          value={props.reportType}
          onValueChange={value => props.onReportTypeChange(value as AdminExportResource)}
          options={reportTypes.map(value => ({ value, label: t(`resources.${value}`) }))}
        />
        <SelectField
          id="report-period"
          label={t('fields.period')}
          value={props.period}
          onValueChange={value => props.onPeriodChange(value as AdminExportPeriod)}
          options={datePresets.map(value => ({ value, label: t(`periods.${value}`) }))}
        />
        {props.period === 'custom' && (
          <>
            <DateField id="report-date-from" label={t('fields.dateFrom')} value={props.dateFrom} onChange={props.onDateFromChange} />
            <DateField id="report-date-to" label={t('fields.dateTo')} value={props.dateTo} onChange={props.onDateToChange} />
          </>
        )}
        <SelectField
          id="report-format"
          label={t('fields.format')}
          value={props.format}
          onValueChange={value => props.onFormatChange(value as AdminExportFormat)}
          options={exportFormats.map(option => ({
            value: option.value,
            label: option.value.toUpperCase(),
          }))}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t('formatNotice')}</p>
      <div className="flex justify-end">
        <Button onClick={props.onGenerate} disabled={props.generating}>
          {props.generating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('generating')}</>
          ) : (
            <><Download className="mr-2 h-4 w-4" />{t('generate')}</>
          )}
        </Button>
      </div>
      {props.error && <p role="alert" className="text-sm text-destructive">{props.error}</p>}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DateField({ id, label, value, onChange }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="date" value={value} onChange={event => onChange(event.target.value)} />
    </div>
  );
}
