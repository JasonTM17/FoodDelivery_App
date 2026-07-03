'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, FileImage, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChartExportMenuProps {
  chartName: string;
  csvData?: Record<string, unknown>[];
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? '');
  const safeText = typeof value === 'string' && /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

export function serializeChartCsv(data: Record<string, unknown>[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(','));
  return `\uFEFF${[headers.map(escapeCsvCell).join(','), ...rows].join('\r\n')}`;
}

function triggerDownload(href: string, fileName: string): void {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
    image.src = url;
  });
}

export default function ChartExportMenu({ chartName, csvData }: ChartExportMenuProps) {
  const t = useTranslations('overviewCharts');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const dateSuffix = () => new Date().toISOString().slice(0, 10);

  const downloadCSV = () => {
    setExportError('');
    if (!csvData?.length) {
      setExportError(t('export.csvEmpty'));
      return;
    }

    const blob = new Blob([serializeChartCsv(csvData)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
      triggerDownload(url, `${chartName}-${dateSuffix()}.csv`);
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      URL.revokeObjectURL(url);
      setExportError(t('export.csvFailed'));
    }
  };

  const downloadPNG = async () => {
    setExporting(true);
    setExportError('');
    let objectUrl: string | undefined;

    try {
      const svg = document.querySelector(`[data-testid="${chartName}-chart"] svg`) as SVGSVGElement | null;
      if (!svg) {
        setExportError(t('export.pngNotFound'));
        return;
      }

      const bounds = svg.getBoundingClientRect();
      const width = Math.max(1, Math.ceil(bounds.width || svg.viewBox.baseVal.width || 800));
      const height = Math.max(1, Math.ceil(bounds.height || svg.viewBox.baseVal.height || 300));
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('width', String(width));
      clone.setAttribute('height', String(height));

      const svgData = new XMLSerializer().serializeToString(clone);
      objectUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
      const image = await loadImage(objectUrl);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('CANVAS_UNAVAILABLE');

      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, height);
      triggerDownload(canvas.toDataURL('image/png'), `${chartName}-${dateSuffix()}.png`);
    } catch {
      setExportError(t('export.pngFailed'));
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {t('export.button')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => void downloadPNG()}>
            <FileImage className="mr-2 h-4 w-4" aria-hidden="true" />
            PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadCSV}>
            <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
            CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {exportError && <p role="alert" className="max-w-56 text-right text-xs text-destructive">{exportError}</p>}
    </div>
  );
}
