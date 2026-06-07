import { Controller, Post, Body, Headers } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'

type TemplateKey =
  | 'tracking_in_transit'
  | 'order_status_prompt'
  | 'cancel_refund_prompt'
  | 'thank_you'
  | 'greeting'

const TEMPLATE_PATTERNS: [RegExp, TemplateKey][] = [
  [/đâu rồi|tới chưa|bao giờ tới|chưa tới|đang ở đâu|where.*order/i, 'tracking_in_transit'],
  [/trạng thái|tình trạng|tiến độ|status|progress/i, 'order_status_prompt'],
  [/hủy đơn|cancel|hoàn tiền|refund/i, 'cancel_refund_prompt'],
  [/cảm ơn|thank|thanks|ありがとう/i, 'thank_you'],
  [/xin chào|hello|hi\b|こんにちは/i, 'greeting'],
]

function pickLang(header: string | undefined): 'vi' | 'en' | 'ja' {
  if (!header) return 'vi'
  const lower = header.toLowerCase()
  if (lower.startsWith('en')) return 'en'
  if (lower.startsWith('ja')) return 'ja'
  return 'vi'
}

@Controller('ai/chat')
export class ChatClassifyController {
  constructor(private readonly i18n: I18nService) {}

  @Post('classify')
  classify(
    @Body() body: { message: string },
    @Headers('accept-language') acceptLang?: string,
  ): { handled: boolean; response: string | null } {
    const msg = (body.message ?? '').trim()
    const lang = pickLang(acceptLang)
    for (const [pattern, key] of TEMPLATE_PATTERNS) {
      if (pattern.test(msg)) {
        const response = this.i18n.t(`ai_templates.${key}`, { lang }) as string
        return { handled: true, response }
      }
    }
    return { handled: false, response: null }
  }
}
