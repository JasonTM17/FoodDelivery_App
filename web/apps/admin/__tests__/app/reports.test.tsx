import { fireEvent, render, screen } from '@testing-library/react';
import { ApiClientError, type AdminExportJob } from '@foodflow/api-client';
import { describe, expect, it, vi } from 'vitest';
import { RecentReportList } from '@/app/[locale]/reports/recent-report-list';
import {
  exportFormats,
  getExportPollingInterval,
  validateCustomDateRange,
} from '@/app/[locale]/reports/report-export-config';

describe('reports UI', () => {
  it('keeps unavailable export formats disabled and validates custom ranges', () => {
    expect(exportFormats.find(format => format.value === 'csv')?.disabled).toBe(false);
    expect(exportFormats.find(format => format.value === 'xlsx')?.disabled).toBe(true);
    expect(exportFormats.find(format => format.value === 'parquet')?.disabled).toBe(true);
    expect(validateCustomDateRange('30d', '', '')).toBeNull();
    expect(validateCustomDateRange('custom', '', '')).toBe('required');
    expect(validateCustomDateRange('custom', '2026-07-03', '2026-07-02')).toBe('invalid');
    expect(validateCustomDateRange('custom', '2026-07-01', '2026-07-02')).toBeNull();
  });

  it('polls only while an export job is still pending', () => {
    expect(getExportPollingInterval({ jobs: [makeJob({ status: 'running' })] })).toBe(5_000);
    expect(getExportPollingInterval({ jobs: [makeJob({ status: 'completed' })] })).toBe(false);
    expect(getExportPollingInterval({ jobs: [] })).toBe(false);
  });

  it('renders a completed database export and delegates its download', () => {
    const onDownload = vi.fn();
    const job = makeJob();

    render(
      <RecentReportList
        jobs={[job]}
        isLoading={false}
        error={null}
        downloadingId={null}
        downloadError=""
        onRetry={vi.fn()}
        onDownload={onDownload}
      />,
    );

    expect(screen.getByText('resources.revenue — CSV')).toBeInTheDocument();
    expect(screen.getByText('statuses.completed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'downloadLabel' }));
    expect(onDownload).toHaveBeenCalledWith(job);
  });

  it('shows a permission state without a retry action for forbidden responses', () => {
    render(
      <RecentReportList
        jobs={[]}
        isLoading={false}
        error={new ApiClientError({ title: 'Forbidden', status: 403 })}
        downloadingId={null}
        downloadError=""
        onRetry={vi.fn()}
        onDownload={vi.fn()}
      />,
    );

    expect(screen.getByText('permissionDenied')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

function makeJob(overrides: Partial<AdminExportJob> = {}): AdminExportJob {
  return {
    id: 'export-1',
    type: 'revenue',
    resource: 'revenue',
    format: 'csv',
    status: 'completed',
    progress: 100,
    rowCount: 20,
    totalRows: 20,
    filterSummary: { period: '30d' },
    createdAt: '2026-07-02T00:00:00.000Z',
    downloadUrl: '/admin/exports/export-1/download',
    ...overrides,
  };
}
