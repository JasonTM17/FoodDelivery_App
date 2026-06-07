import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

export type Locale = 'vi' | 'en' | 'ja'

const LOCALE_DIR_MAP: Record<Locale, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
}

interface RawTemplate {
  title: string
  body: string
  channels: string[]
  critical: boolean
}

export interface RenderedTemplate {
  title: string
  body: string
  critical: boolean
  supportedChannels: string[]
}

@Injectable()
export class TemplateLoader {
  private readonly logger = new Logger(TemplateLoader.name)
  private readonly cache = new Map<string, RawTemplate>()
  private readonly templateRoot = __dirname

  render(
    eventType: string,
    vars: Record<string, string> = {},
    lang: Locale = 'vi',
  ): RenderedTemplate {
    const tpl = this.getTemplate(eventType, lang)
    return {
      title: this.interpolate(tpl.title, vars),
      body: this.interpolate(tpl.body, vars),
      critical: tpl.critical ?? false,
      supportedChannels: tpl.channels ?? [],
    }
  }

  private getTemplate(eventType: string, lang: Locale): RawTemplate {
    const cacheKey = `${lang}:${eventType}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const dir = LOCALE_DIR_MAP[lang] ?? LOCALE_DIR_MAP.vi
    const filePath = path.join(this.templateRoot, dir, `${eventType}.json`)
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const tpl = JSON.parse(raw) as RawTemplate
      this.cache.set(cacheKey, tpl)
      return tpl
    } catch {
      // Fall back to vi-VN if requested locale file is missing
      if (lang !== 'vi') {
        return this.getTemplate(eventType, 'vi')
      }
      this.logger.error(`Template not found for event: ${eventType}`)
      return { title: eventType, body: '', channels: ['in_app'], critical: false }
    }
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`)
  }
}
