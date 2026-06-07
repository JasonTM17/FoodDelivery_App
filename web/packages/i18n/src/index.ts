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
