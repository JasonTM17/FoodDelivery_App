import { Injectable, Logger } from '@nestjs/common'

export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'angry'

// Vietnamese profanity that immediately signals ANGRY
const PROFANITY_PATTERNS = [
  /\b(đm|đmm|vcl|clgt|đéo|mẹ\s*kiếp|đụ\s*má|cặc|lồn|đĩ\s*chó|thằng\s*chó|con\s*mẹ)\b/i,
]

// Anger compound expressions (≥2 match → angry)
const ANGER_KEYWORDS: RegExp[] = [
  /tệ\s*(quá|vãi|thật|kinh)/i,
  /chán\s*(kinh|vãi|thật|ghê)/i,
  /đợi\s*(mãi|hoài|lâu\s*quá|cả\s*tiếng|cả\s*ngày)/i,
  /không\s*(ổn|ok|được|chấp\s*nhận|thể\s*chấp)/i,
  /thất\s*vọng/i,
  /tức\s*quá|điên\s*rồi|chịu\s*hết\s*nổi|bực\s*quá|ức\s*chế/i,
  /lừa\s*đảo|lừa\s*tôi|gian\s*lận|scam|fraud/i,
  /bao\s*giờ\s*mới|sao\s*chậm\s*thế|muộn\s*quá|trễ\s*quá/i,
  /kinh\s*khủng|tệ\s*hại|quá\s*đáng|vô\s*lý/i,
  /đòi\s*tiền|đòi\s*lại\s*tiền|báo\s*cảnh\s*sát|kiện/i,
]

// Single negative signals → 'negative'
const NEGATIVE_KEYWORDS: RegExp[] = [
  /muộn|trễ|chậm|lâu\s*quá/i,
  /sai\s*(món|địa\s*chỉ|đơn)|thiếu\s*(món|đồ|hàng)|nhầm\s*đơn/i,
  /lạnh|nguội|hỏng|thiu|dở\s*lắm/i,
  /mất\s*đơn|không\s*thấy\s*đơn|biến\s*mất/i,
  /không\s*giao|không\s*tới|chưa\s*nhận|chưa\s*tới/i,
  /tài\s*xế\s*(hỗn|thô\s*lỗ|không\s*lịch|chửi|xấu)/i,
]

// Positive signals
const POSITIVE_KEYWORDS: RegExp[] = [
  /cảm\s*ơn|thank\s*(you|u)|tuyệt\s*(vời|quá)|ngon\s*lắm/i,
  /nhanh\s*(lắm|quá)|tốt\s*lắm|hài\s*lòng|ổn\s*rồi|ok\s*rồi/i,
  /hoàn\s*hảo|xuất\s*sắc|thích\s*lắm|yêu\s*FoodFlow|great|excellent/i,
]

@Injectable()
export class SentimentDetectionService {
  private readonly logger = new Logger(SentimentDetectionService.name)

  detect(text: string): SentimentLabel {
    const normalised = text.toLowerCase()

    for (const p of PROFANITY_PATTERNS) {
      if (p.test(normalised)) {
        this.logger.warn('Angry sentiment (profanity) detected')
        return 'angry'
      }
    }

    const angerScore = ANGER_KEYWORDS.filter(p => p.test(normalised)).length
    if (angerScore >= 2) {
      this.logger.warn(`Angry sentiment detected — anger keyword score: ${angerScore}`)
      return 'angry'
    }

    const negScore = NEGATIVE_KEYWORDS.filter(p => p.test(normalised)).length
    if (negScore >= 1 || angerScore === 1) return 'negative'

    const posScore = POSITIVE_KEYWORDS.filter(p => p.test(normalised)).length
    if (posScore >= 1) return 'positive'

    return 'neutral'
  }

  isAngry(text: string): boolean {
    return this.detect(text) === 'angry'
  }
}
