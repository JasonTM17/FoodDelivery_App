'use client';

import { useState } from 'react';
import type {
  AdminExportFormat,
  AdminExportJob,
  AdminExportJobsPayload,
  AdminExportResource,
  CreateAdminExportRequest,
} from '@foodflow/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@foodflow/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiDownload, apiGet, apiPost } from '@/lib/api';
import { ReportExportForm } from './report-export-form';
import {
  getExportPollingInterval,
  type AdminExportPeriod,
  validateCustomDateRange,
} from './report-export-config';
import { RecentReportList } from './recent-report-list';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const [reportType, setReportType] = useState<AdminExportResource>('revenue');
  const [period, setPeriod] = useState<AdminExportPeriod>('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState<AdminExportFormat>('csv');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');

  const query = useQuery<AdminExportJobsPayload>({
    queryKey: ['report-jobs'],
    queryFn: () => apiGet<AdminExportJobsPayload>('/admin/exports', { params: { limit: 20 } }),
    refetchInterval: queryState => getExportPollingInterval(queryState.state.data),
  });

  const handleGenerate = async () => {
    const dateRangeError = validateCustomDateRange(period, dateFrom, dateTo);
    const dateValidationError = dateRangeError === 'required'
      ? t('dateRangeRequired')
      : dateRangeError === 'invalid'
        ? t('dateRangeInvalid')
        : '';
    if (dateValidationError) {
      setGenerateError(dateValidationError);
      return;
    }

    setGenerating(true);
    setGenerateError('');
    try {
      const request: CreateAdminExportRequest = {
        resource: reportType,
        period,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        format,
      };
      await apiPost<AdminExportJob>('/admin/exports', request);
      await query.refetch();
    } catch (error) {
      setGenerateError(error instanceof Error && error.message ? error.message : t('generateError'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (job: AdminExportJob) => {
    setDownloadingId(job.id);
    setDownloadError('');
    try {
      const blob = await apiDownload(`/admin/exports/${job.id}/download`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `foodflow-${job.resource}-${job.id.slice(0, 8)}.${job.format}`;
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      setDownloadError(error instanceof Error && error.message ? error.message : t('downloadError'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
          <CardDescription>{t('createDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportExportForm
            reportType={reportType}
            period={period}
            dateFrom={dateFrom}
            dateTo={dateTo}
            format={format}
            generating={generating}
            error={generateError}
            onReportTypeChange={setReportType}
            onPeriodChange={setPeriod}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onFormatChange={setFormat}
            onGenerate={handleGenerate}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('recentTitle')}</CardTitle>
          <CardDescription>{t('recentDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentReportList
            jobs={query.data?.jobs ?? []}
            isLoading={query.isLoading}
            error={query.error}
            downloadingId={downloadingId}
            downloadError={downloadError}
            onRetry={() => query.refetch()}
            onDownload={handleDownload}
          />
        </CardContent>
      </Card>
    </div>
  );
}
