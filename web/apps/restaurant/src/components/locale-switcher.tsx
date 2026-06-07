'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCALE_OPTIONS = [
  { code: 'vi', label: 'VI', flag: '🇻🇳', name: 'Tiếng Việt' },
  { code: 'en', label: 'EN', flag: '🇺🇸', name: 'English' },
  { code: 'ja', label: 'JA', flag: '🇯🇵', name: '日本語' },
] as const;

type LocaleCode = (typeof LOCALE_OPTIONS)[number]['code'];

function readLocaleCookie(): LocaleCode {
  if (typeof document === 'undefined') return 'vi';
  const found = document.cookie
    .split('; ')
    .find((row) => row.startsWith('NEXT_LOCALE='))
    ?.split('=')?.[1] as LocaleCode | undefined;
  return LOCALE_OPTIONS.some((l) => l.code === found) ? (found as LocaleCode) : 'vi';
}

interface LocaleSwitcherProps {
  collapsed?: boolean;
}

/** Locale-switcher for the restaurant sidebar. Plain HTML — no shadcn dep. */
export function LocaleSwitcher({ collapsed = false }: LocaleSwitcherProps) {
  const router = useRouter();
  const [current, setCurrent] = useState<LocaleCode>('vi');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(readLocaleCookie());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLocale = (locale: LocaleCode) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setCurrent(locale);
    setOpen(false);
    const match = window.location.pathname.match(/^\/(vi|en|ja)(\/.*)?$/);
    if (match) {
      router.push(`/${locale}${match[2] ?? ''}`);
    } else {
      router.refresh();
    }
  };

  const opt = LOCALE_OPTIONS.find((l) => l.code === current) ?? LOCALE_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Switch language"
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted',
          'hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors w-full',
          collapsed && 'justify-center px-2'
        )}
      >
        <Globe className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span aria-hidden="true">{opt.flag}</span>
            <span>{opt.label}</span>
          </>
        )}
      </button>

      {open && (
        <div className={cn(
          'absolute z-50 rounded-lg border border-sidebar-hover bg-sidebar shadow-lg py-1',
          collapsed ? 'left-full top-0 ml-2 w-36' : 'bottom-full mb-1 left-0 w-full'
        )}>
          {LOCALE_OPTIONS.map((locale) => (
            <button
              key={locale.code}
              onClick={() => switchLocale(locale.code)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                current === locale.code
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
              )}
            >
              <span aria-hidden="true">{locale.flag}</span>
              {locale.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
