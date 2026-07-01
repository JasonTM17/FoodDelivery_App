'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/lib/export-helpers';

interface RevenueExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
}

export function RevenueExportButton({ data, filename = 'doanh-thu' }: RevenueExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref} data-testid="revenue-export-button">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-secondary inline-flex items-center gap-1.5 text-sm"
      >
        <Download className="h-4 w-4" />
        Xuất báo cáo
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border bg-white shadow-lg z-10 py-1">
          <button
            type="button"
            onClick={() => { exportToCSV(data, filename); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 text-gray-400" />
            Xuất CSV
          </button>
          <button
            type="button"
            onClick={() => { exportToExcel(data, filename); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-gray-400" />
            Xuất Excel
          </button>
        </div>
      )}
    </div>
  );
}
