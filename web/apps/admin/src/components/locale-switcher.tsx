'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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

/** Locale-switcher dropdown shown in the admin topbar. */
export function LocaleSwitcher() {
  const router = useRouter();
  const [current, setCurrent] = useState<LocaleCode>('vi');

  useEffect(() => {
    setCurrent(readLocaleCookie());
  }, []);

  const switchLocale = (locale: LocaleCode) => {
    // Persist choice for both middleware and root layout cookie-read
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setCurrent(locale);

    // If the current URL already has a locale prefix, swap it
    const match = window.location.pathname.match(/^\/(vi|en|ja)(\/.*)?$/);
    if (match) {
      const rest = match[2] ?? '';
      router.push(`/${locale}${rest}`);
    } else {
      // Non-locale route — refresh so the root layout picks up the new cookie
      router.refresh();
    }
  };

  const opt = LOCALE_OPTIONS.find((l) => l.code === current) ?? LOCALE_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 px-2 text-xs font-medium"
          aria-label="Switch language"
        >
          <Globe className="h-3.5 w-3.5" />
          <span aria-hidden="true">{opt.flag}</span>
          <span>{opt.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LOCALE_OPTIONS.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => switchLocale(locale.code)}
            className={current === locale.code ? 'bg-accent font-medium' : ''}
          >
            <span className="mr-2" aria-hidden="true">{locale.flag}</span>
            {locale.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
