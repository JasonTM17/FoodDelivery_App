import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client } from 'minio'
import { randomBytes } from 'crypto'
import { resolveMinioRuntimeConfig } from '../common/storage/minio-config'

const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const MAX_PHOTOS_PER_REVIEW = 4
const PRESIGN_EXPIRY_SECONDS = 900 // 15 min

@Injectable()
export class ReviewsPhotoService {
  private readonly logger = new Logger(ReviewsPhotoService.name)
  private readonly client: Client
  private readonly bucket: string

  constructor(private readonly config: ConfigService) {
    const minio = resolveMinioRuntimeConfig(config)
    this.client = new Client(minio.client)
    this.bucket = minio.bucket
  }

  async getUploadUrl(contentType: string): Promise<{ url: string; key: string }> {
    if (!ALLOWED_PHOTO_TYPES.has(contentType)) {
      throw new BadRequestException(
        `Content type '${contentType}' not allowed. Accepted: ${[...ALLOWED_PHOTO_TYPES].join(', ')}`,
      )
    }

    const ext = contentType.split('/')[1] ?? 'jpg'
    const key = `reviews/photos/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`

    try {
      const url = await this.client.presignedPutObject(
        this.bucket,
        key,
        PRESIGN_EXPIRY_SECONDS,
      )
      return { url, key }
    } catch (err) {
      this.logger.error(`Failed to generate presigned URL: ${(err as Error).message}`)
      throw new BadRequestException('Could not generate upload URL. Storage unavailable.')
    }
  }

  // Validates client-submitted photo array before persisting.
  // Server-side max-size enforcement is handled by client using presigned URL constraints.
  validatePhotoCount(photos: string[]): void {
    if (photos.length > MAX_PHOTOS_PER_REVIEW) {
      throw new BadRequestException(
        `Maximum ${MAX_PHOTOS_PER_REVIEW} photos allowed per review`,
      )
    }
  }
}
