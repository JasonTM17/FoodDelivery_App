import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

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
  private readonly templateDir = path.join(__dirname, 'vi-VN')

  render(eventType: string, vars: Record<string, string> = {}): RenderedTemplate {
    const tpl = this.getTemplate(eventType)
    return {
      title: this.interpolate(tpl.title, vars),
      body: this.interpolate(tpl.body, vars),
      critical: tpl.critical ?? false,
      supportedChannels: tpl.channels ?? [],
    }
  }

  private getTemplate(eventType: string): RawTemplate {
    if (this.cache.has(eventType)) {
      return this.cache.get(eventType)!
    }
    const filePath = path.join(this.templateDir, `${eventType}.json`)
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const tpl = JSON.parse(raw) as RawTemplate
      this.cache.set(eventType, tpl)
      return tpl
    } catch {
      this.logger.error(`Template not found for event: ${eventType}`)
      return { title: eventType, body: '', channels: ['in_app'], critical: false }
    }
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`)
  }
}
