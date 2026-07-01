'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileImage, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ChartExportMenuProps {
  chartName: string;
  chartRef?: React.RefObject<HTMLDivElement>;
  csvData?: Record<string, unknown>[];
}

export default function ChartExportMenu({ chartName, csvData }: ChartExportMenuProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const downloadCSV = () => {
    if (!csvData || csvData.length === 0) return;
    const headers = Object.keys(csvData[0]);
    const rows = csvData.map((row) => headers.map((h) => String(row[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chartName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = async () => {
    setExporting(true);
    setExportError('');
    try {
      // Use canvas-based approach: find SVG element in chart, convert to canvas, download
      const svg = document.querySelector(`[data-testid="${chartName}-chart"] svg`) as SVGSVGElement | null;
      if (!svg) {
        setExportError('Không tìm thấy biểu đồ để xuất PNG');
        setExporting(false);
        return;
      }
      const clone = svg.cloneNode(true) as SVGSVGElement;
      const svgData = new XMLSerializer().serializeToString(clone);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx?.scale(2, 2);
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${chartName}-${new Date().toISOString().split('T')[0]}.png`;
        a.click();
        setExporting(false);
      };
      img.src = url;
    } catch (err) {
      setExportError((err as { message?: string }).message || 'Không thể xuất biểu đồ PNG');
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Xuất
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={downloadPNG}>
          <FileImage className="mr-2 h-4 w-4" />
          PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
      {exportError && <p className="text-xs text-destructive">{exportError}</p>}
    </div>
  );
}
