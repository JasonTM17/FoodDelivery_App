import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { I18nService } from 'nestjs-i18n'

const localeCache = new Map<string, Record<string, unknown>>()

export function loadLocaleNamespace(lang: string, namespace: string): Record<string, unknown> {
  const cacheKey = `${lang}:${namespace}`
  const cached = localeCache.get(cacheKey)
  if (cached) return cached

  const filePath = join(process.cwd(), 'src', 'i18n', 'locales', lang, `${namespace}.json`)
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
  localeCache.set(cacheKey, parsed)
  return parsed
}

export function translateTestKey(
  key: string,
  args: Record<string, unknown> = {},
  lang = 'vi',
): string {
  const [namespace, ...segments] = key.split('.')
  if (!namespace || segments.length === 0) return key

  let current: unknown = loadLocaleNamespace(lang, namespace)
  for (const segment of segments) {
    if (!current || typeof current !== 'object') return key
    current = (current as Record<string, unknown>)[segment]
  }

  if (typeof current !== 'string') return key
  return current.replace(/\{(\w+)\}/g, (_, name: string) => String(args[name] ?? `{${name}}`))
}

export function createI18nTestService(defaultLang = 'vi'): I18nService {
  return {
    t: (key: string, options?: { lang?: string; args?: Record<string, unknown> }) =>
      translateTestKey(key, options?.args, options?.lang ?? defaultLang),
  } as unknown as I18nService
}
