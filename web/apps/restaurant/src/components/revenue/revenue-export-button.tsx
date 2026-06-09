'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RevenueExportButtonProps {
  onExportCSV: () => void;
  onExportExcel?: () => void;
  disabled?: boolean;
  className?: string;
}

export function RevenueExportButton({ onExportCSV, onExportExcel, disabled, className }: RevenueExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="btn-secondary text-sm flex items-center gap-1.5"
      >
        <Download className="h-4 w-4" />
        Xuất báo cáo
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-white shadow-lg py-1 z-30">
          <button
            onClick={() => { onExportCSV(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
          >
            <FileText className="h-4 w-4 text-gray-400" />
            Xuất CSV
          </button>
          {onExportExcel && (
            <button
              onClick={() => { onExportExcel(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Xuất Excel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
