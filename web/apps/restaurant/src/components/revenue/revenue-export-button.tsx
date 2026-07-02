'use client';

import { useState, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/lib/export-helpers';
import { useTranslations } from 'next-intl';

interface RevenueExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
}

export function RevenueExportButton({ data, filename }: RevenueExportButtonProps) {
  const t = useTranslations('revenue.export');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const resolvedFilename = filename ?? t('defaultFilename');
  const disabled = data.length === 0;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handlePointerDown);
      firstItemRef.current?.focus();
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  const closeAndRestoreFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
    );
    const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      closeAndRestoreFocus();
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') items[0]?.focus();
    if (event.key === 'End') items.at(-1)?.focus();
    if (event.key === 'ArrowDown') items[(activeIndex + 1) % items.length]?.focus();
    if (event.key === 'ArrowUp') items[(activeIndex - 1 + items.length) % items.length]?.focus();
  };

  return (
    <div className="relative" ref={ref} data-testid="revenue-export-button">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        title={disabled ? t('emptyDisabled') : undefined}
        className="btn-secondary inline-flex items-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {t('button')}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg"
          role="menu"
          aria-label={t('menuAria')}
          onKeyDown={handleMenuKeyDown}
        >
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            onClick={() => { exportToCSV(data, resolvedFilename); closeAndRestoreFocus(); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 text-gray-400" />
            {t('csv')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { exportToExcel(data, resolvedFilename); closeAndRestoreFocus(); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-gray-400" />
            {t('excel')}
          </button>
        </div>
      )}
    </div>
  );
}
