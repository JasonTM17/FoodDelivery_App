'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/navigation';
import { cn } from '@/lib/utils';

const LOCALE_OPTIONS = [
  { code: 'vi', label: 'VI', flag: '🇻🇳' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'ja', label: 'JA', flag: '🇯🇵' },
] as const;

type LocaleCode = (typeof LOCALE_OPTIONS)[number]['code'];

interface LocaleSwitcherProps {
  collapsed?: boolean;
}

export function LocaleSwitcher({ collapsed = false }: LocaleSwitcherProps) {
  const t = useTranslations('localeSwitcher');
  const menuId = useId();
  const locale = useLocale();
  const current = isLocaleCode(locale) ? locale : 'vi';
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = LOCALE_OPTIONS.find((option) => option.code === current) ?? LOCALE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const switchLocale = (locale: LocaleCode) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setOpen(false);
    router.replace(pathname, { locale });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('triggerAria', { language: t(`languages.${current}`) })}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
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
          id={menuId}
          role="menu"
          aria-label={t('menuAria')}
          className={cn(
            'absolute z-50 rounded-lg border border-sidebar-hover bg-sidebar py-1 shadow-lg',
            collapsed ? 'left-full top-0 ml-2 w-36' : 'bottom-full left-0 mb-1 w-full',
          )}
        >
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              role="menuitemradio"
              aria-checked={current === option.code}
              onClick={() => switchLocale(option.code)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                current === option.code
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
              )}
            >
              <span aria-hidden="true">{option.flag}</span>
              {t(`languages.${option.code}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function isLocaleCode(locale: string): locale is LocaleCode {
  return LOCALE_OPTIONS.some((option) => option.code === locale);
}
