import { fireEvent, render, screen } from '@testing-library/react';
import type { AdminExportJob } from '@foodflow/api-client';
import { describe, expect, it, vi } from 'vitest';
import {
  getExportJobsPollingInterval,
  getExportJobsQueryParams,
} from '@/app/[locale]/export-jobs/export-jobs-config';
import { ExportJobsTable } from '@/app/[locale]/export-jobs/export-jobs-table';

describe('export jobs UI', () => {
  it('renders canonical export data and delegates downloads', () => {
    const onDownload = vi.fn();
    const job = makeJob();

    render(<ExportJobsTable jobs={[job]} downloadingId={null} onDownload={onDownload} />);

    expect(screen.getByText('export-1')).toBeInTheDocument();
    expect(screen.getByText('statuses.completed')).toBeInTheDocument();
    expect(screen.getByText('filterKeys.period: 30d')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    fireEvent.click(screen.getByRole('button', { name: 'downloadLabel' }));
    expect(onDownload).toHaveBeenCalledWith(job);
  });

  it('clamps runtime progress and disables every download during an active download', () => {
    render(
      <ExportJobsTable
        jobs={[
          makeJob({ id: 'export-1', progress: 140 }),
          makeJob({ id: 'export-2', progress: 20 }),
          makeJob({ id: 'export-3', status: 'running', progress: 140, downloadUrl: undefined }),
        ]}
        downloadingId="export-1"
        onDownload={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('progressbar')[2]).toHaveAttribute('aria-valuenow', '100');
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });

  it('polls only while queued or running jobs remain', () => {
    expect(getExportJobsPollingInterval({ jobs: [makeJob({ status: 'queued' })] })).toBe(5_000);
    expect(getExportJobsPollingInterval({ jobs: [makeJob({ status: 'completed' })] })).toBe(false);
    expect(getExportJobsPollingInterval()).toBe(false);
  });

  it('sends status filtering to the backend instead of filtering a truncated client list', () => {
    expect(getExportJobsQueryParams('all')).toEqual({ limit: 30, status: undefined });
    expect(getExportJobsQueryParams('failed')).toEqual({ limit: 30, status: 'failed' });
  });
});

function makeJob(overrides: Partial<AdminExportJob> = {}): AdminExportJob {
  return {
    id: 'export-12345678',
    type: 'revenue',
    resource: 'revenue',
    format: 'csv',
    status: 'completed',
    progress: 100,
    rowCount: 20,
    totalRows: 20,
    filterSummary: { period: '30d' },
    createdAt: '2026-07-02T00:00:00.000Z',
    downloadUrl: '/admin/exports/export-12345678/download',
    ...overrides,
  };
}
