'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/navigation';
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

export function LocaleSwitcher() {
  const current = useLocale() as LocaleCode;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('topbar');

  const switchLocale = (locale: LocaleCode) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    document.documentElement.lang = locale;
    router.replace(pathname, { locale });
  };

  const selected = LOCALE_OPTIONS.find((option) => option.code === current) ?? LOCALE_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 px-2 text-xs font-medium"
          aria-label={t('switchLanguage')}
        >
          <Globe aria-hidden="true" className="h-3.5 w-3.5" />
          <span aria-hidden="true">{selected.flag}</span>
          <span>{selected.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LOCALE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => switchLocale(option.code)}
            className={current === option.code ? 'bg-accent font-medium' : ''}
          >
            <span className="mr-2" aria-hidden="true">{option.flag}</span>
            {option.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
