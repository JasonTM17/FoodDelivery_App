import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client } from 'minio'
import { randomBytes } from 'crypto'
import { extname } from 'path'
import { resolveMinioRuntimeConfig } from '../common/storage/minio-config'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

const DEFAULT_MAX_UPLOAD_MB = 5

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
  private readonly maxFileSizeBytes: number
  private readonly maxFileSizeMb: number

  constructor(private readonly config: ConfigService) {
    const minio = resolveMinioRuntimeConfig(config, { requirePublicUrl: true })
    this.client = new Client(minio.client)
    this.bucket = minio.bucket
    this.publicUrl = minio.publicUrl!
    this.maxFileSizeMb = this.numberConfig('STORAGE_MAX_UPLOAD_MB', DEFAULT_MAX_UPLOAD_MB, 1, 50)
    this.maxFileSizeBytes = this.maxFileSizeMb * 1024 * 1024
  }

  /**
   * Upload a file to the MinIO bucket.
   *
   * Validates file size, MIME type, and image magic bytes before uploading.
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
      throw err
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

    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException(
        `File size exceeds the ${this.maxFileSizeMb} MB limit (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
      )
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed. Accepted types: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      )
    }

    if (!matchesImageMimeType(file.buffer, file.mimetype)) {
      throw new BadRequestException(`File content does not match declared MIME type '${file.mimetype}'`)
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

  private numberConfig(key: string, fallback: number, min: number, max: number): number {
    const raw = this.config.get<string | number>(key)
    const value = raw === undefined || raw === null || raw === '' ? fallback : Number(raw)
    if (!Number.isFinite(value)) return fallback
    return Math.min(max, Math.max(min, Math.round(value)))
  }
}

function matchesImageMimeType(buffer: Buffer, mimetype: string): boolean {
  switch (mimetype) {
    case 'image/jpeg':
      return hasBytes(buffer, [0xff, 0xd8, 0xff])
    case 'image/png':
      return hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case 'image/gif':
      return buffer.subarray(0, 6).toString('ascii') === 'GIF87a'
        || buffer.subarray(0, 6).toString('ascii') === 'GIF89a'
    case 'image/webp':
      return buffer.length >= 12
        && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
        && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    case 'image/avif':
      return buffer.length >= 12
        && buffer.subarray(4, 8).toString('ascii') === 'ftyp'
        && buffer.subarray(8, Math.min(buffer.length, 32)).includes(Buffer.from('avif'))
    default:
      return false
  }
}

function hasBytes(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false
  return bytes.every((byte, index) => buffer[offset + index] === byte)
}
