import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

const PROFANITY_LIST: readonly string[] = [
  'đụ', 'địt', 'lồn', 'cặc', 'buồi', 'dái', 'đéo', 'mẹ kiếp', 'đcm', 'vcl', 'vkl',
  'óc chó', 'đần', 'khốn', 'mẹ mày', 'đù mẹ', 'cứt', 'chó đẻ', 'thằng chó',
  'con chó', 'súc vật', 'đồ điên', 'thất học', 'vô học', 'ngu như chó', 'đmm', 'đmcs',
  'đcmm', 'dmm', 'thằng ngu', 'con ngu', 'ăn cứt', 'mút cặc', 'liếm lồn',
  'đu má', 'đù má', 'má mày', 'cái lồn', 'thằng khốn', 'con khốn', 'đm', 'dm',
]

const NORMALIZED_LIST = PROFANITY_LIST.map(w => w.toLowerCase())

export interface ProfanityResult {
  clean: boolean
  flagged_words: string[]
}

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  checkProfanity(text: string): ProfanityResult {
    const lower = text.toLowerCase()
    const flagged_words: string[] = []

    for (const word of NORMALIZED_LIST) {
      if (lower.includes(word)) {
        flagged_words.push(word)
      }
    }

    return { clean: flagged_words.length === 0, flagged_words }
  }

  async adminHide(reviewId: string, adminUserId: string, reason: string): Promise<void> {
    const review = await this.prisma.review.findUniqueOrThrow({ where: { id: reviewId } })

    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { isHidden: true, hiddenReason: reason },
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId: review.orderId,
          status: 'review_hidden',
          changedBy: adminUserId,
          note: `Review ${reviewId} hidden: ${reason}`,
        },
      })
    })
  }
}
