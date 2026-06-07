/**
 * Canonical locale codes used across the backend.
 * Single source of truth — any module that needs a typed locale value
 * should import from here, not redeclare.
 */
export type Locale = 'vi' | 'en' | 'ja'

export const LOCALES: readonly Locale[] = ['vi', 'en', 'ja'] as const

export const DEFAULT_LOCALE: Locale = 'vi'

export function isLocale(value: string): value is Locale {
  return value === 'vi' || value === 'en' || value === 'ja'
}

export function resolveLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE
  const normalized = value.toLowerCase().slice(0, 2)
  return isLocale(normalized) ? normalized : DEFAULT_LOCALE
}
