'use client';

import { useLocale } from 'next-intl';
import { useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/navigation';
import { cn } from '@/lib/utils';

const LOCALE_OPTIONS = [
  { code: 'vi', label: 'VI', flag: '🇻🇳', name: 'Tiếng Việt' },
  { code: 'en', label: 'EN', flag: '🇺🇸', name: 'English' },
  { code: 'ja', label: 'JA', flag: '🇯🇵', name: '日本語' },
] as const;

type LocaleCode = (typeof LOCALE_OPTIONS)[number]['code'];

interface LocaleSwitcherProps {
  collapsed?: boolean;
}

export function LocaleSwitcher({ collapsed = false }: LocaleSwitcherProps) {
  const current = useLocale() as LocaleCode;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = LOCALE_OPTIONS.find((option) => option.code === current) ?? LOCALE_OPTIONS[0];

  const switchLocale = (locale: LocaleCode) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setOpen(false);
    router.replace(pathname, { locale });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Switch language"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted',
          'transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground',
          collapsed && 'justify-center px-2',
        )}
      >
        <Globe className="h-4 w-4 shrink-0" />
        {!collapsed && <><span aria-hidden="true">{selected.flag}</span><span>{selected.label}</span></>}
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 rounded-lg border border-sidebar-hover bg-sidebar py-1 shadow-lg',
            collapsed ? 'left-full top-0 ml-2 w-36' : 'bottom-full left-0 mb-1 w-full',
          )}
        >
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option.code}
              onClick={() => switchLocale(option.code)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                current === option.code
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
              )}
            >
              <span aria-hidden="true">{option.flag}</span>
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
