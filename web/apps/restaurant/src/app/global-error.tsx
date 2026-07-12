'use client';

import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import type { Locale } from '@foodflow/i18n';
import viMessages from '../../messages/vi.json';
import enMessages from '../../messages/en.json';
import jaMessages from '../../messages/ja.json';
import { RefreshCw } from 'lucide-react';

const LOCALES = ['vi', 'en', 'ja'] as const;
const globalErrorMessages = {
  vi: viMessages.rootStates.globalError,
  en: enMessages.rootStates.globalError,
  ja: jaMessages.rootStates.globalError,
} as const;

function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && (LOCALES as readonly string[]).includes(value));
}

function resolveLocale(): Locale {
  if (typeof document !== 'undefined') {
    const htmlLocale = document.documentElement.lang.split('-')[0];
    if (isLocale(htmlLocale)) return htmlLocale;
  }

  if (typeof window !== 'undefined') {
    const pathLocale = window.location.pathname.split('/').filter(Boolean)[0];
    if (isLocale(pathLocale)) return pathLocale;
  }

  return 'vi';
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = resolveLocale();
  const copy = globalErrorMessages[locale];

  return (
    <html lang={locale}>
      <body className="bg-background">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
          <FoodFlowLogo showWordmark={false} markClassName="h-20 w-20" />
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              {copy.description}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            {copy.reload}
          </button>
        </div>
      </body>
    </html>
  );
}
