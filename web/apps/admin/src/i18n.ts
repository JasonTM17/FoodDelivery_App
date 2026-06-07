import { getRequestConfig } from 'next-intl/server';
import { getSharedMessages, locales, defaultLocale } from '@foodflow/i18n';
import type { Locale } from '@foodflow/i18n';
import viMessages from '../messages/vi.json';
import enMessages from '../messages/en.json';
import jaMessages from '../messages/ja.json';

const appMessages = {
  vi: viMessages,
  en: enMessages,
  ja: jaMessages,
} as const;

/**
 * next-intl request config for the admin app.
 * Merges shared (@foodflow/i18n) messages with admin-specific messages.
 */
export default getRequestConfig(async ({ locale }) => {
  const safeLocale: Locale = (locales as readonly string[]).includes(locale ?? '')
    ? (locale as Locale)
    : defaultLocale;

  return {
    locale: safeLocale,
    messages: {
      ...getSharedMessages(safeLocale),
      ...appMessages[safeLocale],
    },
  };
});
