import viMessages from '../messages/vi.json';
import enMessages from '../messages/en.json';
import jaMessages from '../messages/ja.json';

export const locales = ['vi', 'en', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'vi';

const allMessages = { vi: viMessages, en: enMessages, ja: jaMessages };

/** Returns shared translation messages for the given locale. Falls back to vi. */
export function getSharedMessages(locale: string) {
  return allMessages[locale as Locale] ?? allMessages.vi;
}

export type SharedMessages = typeof viMessages;

export function getLocaleFromPathname(pathname: string): Locale | null {
  const locale = pathname.match(/^\/(vi|en|ja)(?:\/|$)/)?.[1];
  return locale && locales.includes(locale as Locale) ? (locale as Locale) : null;
}

export function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/(vi|en|ja)(?=\/|$)/, '');
  return stripped || '/';
}

export function localizePath(pathname: string, locale: Locale): string {
  const normalized = stripLocalePrefix(pathname);
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}
