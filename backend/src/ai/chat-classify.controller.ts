import { Controller, Post, Body } from '@nestjs/common'

const TEMPLATE_PATTERNS: [RegExp, string][] = [
  [
    /đâu rồi|tới chưa|bao giờ tới|chưa tới|đang ở đâu/i,
    'Đơn hàng của bạn đang trên đường giao. Bạn có thể theo dõi vị trí tài xế trong ứng dụng.',
  ],
  [
    /trạng thái|tình trạng|tiến độ/i,
    'Để kiểm tra trạng thái đơn hàng, vui lòng cung cấp mã đơn hàng của bạn.',
  ],
  [
    /hủy đơn|cancel|hoàn tiền|refund/i,
    'Bạn muốn hủy đơn hoặc yêu cầu hoàn tiền? Vui lòng cung cấp mã đơn hàng.',
  ],
  [
    /cảm ơn|thank|thanks/i,
    'Cảm ơn bạn đã sử dụng FoodFlow! Chúc bạn ngon miệng.',
  ],
  [
    /xin chào|hello|hi\b/i,
    'Xin chào! Tôi là FoodFlow AI Assistant. Tôi có thể giúp gì cho bạn?',
  ],
]

@Controller('ai/chat')
export class ChatClassifyController {
  @Post('classify')
  classify(@Body() body: { message: string }): { handled: boolean; response: string | null } {
    const msg = (body.message ?? '').trim()
    for (const [pattern, reply] of TEMPLATE_PATTERNS) {
      if (pattern.test(msg)) {
        return { handled: true, response: reply }
      }
    }
    return { handled: false, response: null }
  }
}
