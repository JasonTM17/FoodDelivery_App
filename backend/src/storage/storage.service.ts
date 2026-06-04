import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client } from 'minio'
import { randomBytes } from 'crypto'
import { extname } from 'path'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export interface UploadedFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  buffer: Buffer
  size: number
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly client: Client
  private readonly bucket: string
  private readonly publicUrl: string

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      endPoint: config.get<string>('MINIO_ENDPOINT') ?? 'localhost',
      port: config.get<number>('MINIO_PORT') ?? 9000,
      useSSL: false,
      accessKey: config.get<string>('MINIO_ACCESS_KEY') ?? '',
      secretKey: config.get<string>('MINIO_SECRET_KEY') ?? '',
    })

    this.bucket = config.get<string>('MINIO_BUCKET') ?? 'foodflow'
    this.publicUrl = config.get<string>('MINIO_PUBLIC_URL') ?? 'http://localhost:9000'
  }

  /**
   * Upload a file to the MinIO bucket.
   *
   * Validates file size (max 5 MB) and MIME type (images only) before uploading.
   * Returns the public URL of the uploaded object.
   */
  async uploadFile(file: UploadedFile, prefix: string): Promise<{ url: string; key: string }> {
    this.validateFile(file)

    const ext = extname(file.originalname).toLowerCase() || '.bin'
    const key = `${prefix}/${Date.now()}-${randomBytes(8).toString('hex')}${ext}`

    try {
      await this.ensureBucket()

      await this.client.putObject(this.bucket, key, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      })

      const url = `${this.publicUrl.replace(/\/$/, '')}/${this.bucket}/${key}`
      this.logger.log(`Uploaded file to ${key} (${file.size} bytes)`)

      return { url, key }
    } catch (err) {
      this.logger.error(`Failed to upload file: ${(err as Error).message}`)
      throw new InternalServerErrorException('File upload failed. Storage service unavailable.')
    }
  }

  /**
   * Delete an object from the bucket by its key.
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key)
      this.logger.log(`Deleted file ${key}`)
    } catch (err) {
      this.logger.error(`Failed to delete file ${key}: ${(err as Error).message}`)
    }
  }

  /**
   * Upload a user avatar. Thin wrapper over uploadFile with fixed prefix.
   */
  async uploadAvatar(userId: string, file: UploadedFile): Promise<{ url: string }> {
    const { url } = await this.uploadFile(file, `avatars/${userId}`)
    return { url }
  }

  private validateFile(file: UploadedFile): void {
    if (!file.buffer || file.size === 0) {
      throw new BadRequestException('Uploaded file is empty')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds the 5 MB limit (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`)
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed. Accepted types: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      )
    }
  }

  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket)
      if (!exists) {
        await this.client.makeBucket(this.bucket)
        this.logger.log(`Created bucket '${this.bucket}'`)
      }
    } catch (err) {
      this.logger.error(`Failed to check/create bucket: ${(err as Error).message}`)
      throw new InternalServerErrorException('Storage service unavailable.')
    }
  }
}
