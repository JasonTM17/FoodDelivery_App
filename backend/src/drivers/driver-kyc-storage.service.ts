import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { Client } from 'minio'
import { resolveMinioRuntimeConfig } from '../common/storage/minio-config'
import { getSupabaseSecretKey } from '../common/supabase/supabase-config'
import {
  KYC_DOCUMENT_TYPES,
  KYC_IMAGE_CONTENT_TYPES,
  KYC_MIN_UPLOAD_BYTES,
  type KycDocumentObjects,
  type KycDocumentType,
  type KycImageContentType,
} from './driver-kyc.zod'

const SIGNED_URL_TTL_SECONDS = 15 * 60
const ADMIN_READ_TTL_SECONDS = 5 * 60
const DEFAULT_KYC_MAX_UPLOAD_MB = 4
const SIGNATURE_BYTES = 64
const KYC_CACHE_CONTROL = 'private, max-age=0, no-store'

export interface KycUploadGrant {
  uploadUrl: string
  objectKey: string
  headers: Record<string, string>
}

@Injectable()
export class DriverKycStorageService {
  private readonly logger = new Logger(DriverKycStorageService.name)
  private readonly provider: 'minio' | 'supabase'
  private readonly minio?: Client
  private readonly supabase?: SupabaseClient
  private readonly bucket: string
  private readonly maxUploadBytes: number

  constructor(config: ConfigService) {
    this.provider = config.get<string>('STORAGE_PROVIDER') === 'supabase' ? 'supabase' : 'minio'
    this.maxUploadBytes = numberConfig(
      config,
      'DRIVER_KYC_MAX_UPLOAD_MB',
      DEFAULT_KYC_MAX_UPLOAD_MB,
      1,
      4,
    ) * 1024 * 1024

    if (this.provider === 'supabase') {
      this.bucket = requireStringConfig(config, 'SUPABASE_KYC_BUCKET')
      this.supabase = createClient(
        requireStringConfig(config, 'SUPABASE_URL'),
        getSupabaseSecretKey(config),
        { auth: { persistSession: false, autoRefreshToken: false } },
      )
      return
    }

    const minio = resolveMinioRuntimeConfig(config)
    this.minio = new Client(minio.client)
    this.bucket = requireStringConfig(config, 'MINIO_KYC_BUCKET')
  }

  async createUploadGrant(
    driverId: string,
    documentType: KycDocumentType,
    contentType: KycImageContentType,
    sizeBytes: number,
  ): Promise<KycUploadGrant> {
    this.assertUploadMetadata(contentType, sizeBytes)
    const extension = extensionForContentType(contentType)
    const objectKey = `kyc/${driverId}/${Date.now()}-${randomBytes(12).toString('hex')}-${documentType}.${extension}`

    try {
      if (this.provider === 'supabase') {
        const { data, error } = await this.supabase!.storage
          .from(this.bucket)
          .createSignedUploadUrl(objectKey, { upsert: false })
        if (error) throw error
        return {
          uploadUrl: data.signedUrl,
          objectKey,
          headers: {
            'cache-control': KYC_CACHE_CONTROL,
            'content-type': contentType,
            'x-upsert': 'false',
          },
        }
      }

      await this.ensureMinioBucket()
      return {
        uploadUrl: await this.minio!.presignedPutObject(
          this.bucket,
          objectKey,
          SIGNED_URL_TTL_SECONDS,
        ),
        objectKey,
        headers: {
          'cache-control': KYC_CACHE_CONTROL,
          'content-type': contentType,
        },
      }
    } catch (error) {
      this.logger.error(`Could not create KYC upload grant for driver ${driverId}: ${errorMessage(error)}`)
      throw new ServiceUnavailableException('KYC_STORAGE_UNAVAILABLE')
    }
  }

  async validateSubmissionObjects(
    driverId: string,
    documents: KycDocumentObjects,
  ): Promise<void> {
    const objectKeys = KYC_DOCUMENT_TYPES.map(documentType => documents[documentType])
    if (new Set(objectKeys).size !== objectKeys.length) {
      throw new BadRequestException('KYC_DOCUMENT_KEYS_MUST_BE_UNIQUE')
    }

    for (const documentType of KYC_DOCUMENT_TYPES) {
      const objectKey = documents[documentType]
      this.assertOwnedObjectKey(driverId, objectKey, documentType)
      await this.validateStoredObject(objectKey)
    }
  }

  async createSignedReadUrls(
    driverId: string,
    documents: KycDocumentObjects,
  ): Promise<Record<KycDocumentType, string>> {
    const entries = await Promise.all(KYC_DOCUMENT_TYPES.map(async documentType => {
      const objectKey = documents[documentType]
      this.assertOwnedObjectKey(driverId, objectKey, documentType)
      if (this.provider === 'supabase') {
        const { data, error } = await this.supabase!.storage
          .from(this.bucket)
          .createSignedUrl(objectKey, ADMIN_READ_TTL_SECONDS)
        if (error) throw error
        return [documentType, data.signedUrl] as const
      }

      await this.ensureMinioBucket()
      const url = await this.minio!.presignedGetObject(
        this.bucket,
        objectKey,
        ADMIN_READ_TTL_SECONDS,
      )
      return [documentType, url] as const
    }))

    return Object.fromEntries(entries) as Record<KycDocumentType, string>
  }

  private async validateStoredObject(objectKey: string): Promise<void> {
    try {
      if (this.provider === 'supabase') {
        const bucket = this.supabase!.storage.from(this.bucket)
        const { data: info, error: infoError } = await bucket.info(objectKey)
        if (infoError) throw infoError
        const contentType = normalizeStoredContentType(info.contentType)
        this.assertUploadMetadata(contentType, info.size ?? 0)

        const { data: blob, error: downloadError } = await bucket.download(objectKey)
        if (downloadError) throw downloadError
        const signature = Buffer.from(await blob.slice(0, SIGNATURE_BYTES).arrayBuffer())
        this.assertImageSignature(signature, contentType)
        return
      }

      await this.ensureMinioBucket()
      const stat = await this.minio!.statObject(this.bucket, objectKey)
      const contentType = normalizeStoredContentType(
        stat.metaData['content-type'] ?? stat.metaData['Content-Type'],
      )
      this.assertUploadMetadata(contentType, stat.size)
      const stream = await this.minio!.getPartialObject(
        this.bucket,
        objectKey,
        0,
        SIGNATURE_BYTES,
      )
      const chunks: Buffer[] = []
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      this.assertImageSignature(Buffer.concat(chunks), contentType)
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      this.logger.warn(`KYC object validation failed: ${errorMessage(error)}`)
      throw new BadRequestException('KYC_DOCUMENT_NOT_FOUND_OR_INVALID')
    }
  }

  private assertUploadMetadata(contentType: string, sizeBytes: number): asserts contentType is KycImageContentType {
    if (!(KYC_IMAGE_CONTENT_TYPES as readonly string[]).includes(contentType)) {
      throw new BadRequestException('KYC_DOCUMENT_CONTENT_TYPE_NOT_ALLOWED')
    }
    if (
      !Number.isInteger(sizeBytes)
      || sizeBytes < KYC_MIN_UPLOAD_BYTES
      || sizeBytes > this.maxUploadBytes
    ) {
      throw new BadRequestException('KYC_DOCUMENT_SIZE_INVALID')
    }
  }

  private assertImageSignature(buffer: Buffer, contentType: KycImageContentType): void {
    if (!matchesKycImageMimeType(buffer, contentType)) {
      throw new BadRequestException('KYC_DOCUMENT_SIGNATURE_INVALID')
    }
  }

  private assertOwnedObjectKey(
    driverId: string,
    objectKey: string,
    documentType: KycDocumentType,
  ): void {
    const escapedDriverId = escapeRegex(driverId)
    const escapedDocumentType = escapeRegex(documentType)
    const pattern = new RegExp(
      `^kyc/${escapedDriverId}/\\d{13}-[a-f0-9]{24}-${escapedDocumentType}\\.(?:jpg|png|webp)$`,
    )
    if (!pattern.test(objectKey)) {
      throw new BadRequestException('KYC_DOCUMENT_OWNERSHIP_INVALID')
    }
  }

  private async ensureMinioBucket(): Promise<void> {
    const exists = await this.minio!.bucketExists(this.bucket)
    if (!exists) await this.minio!.makeBucket(this.bucket)
  }
}

export function matchesKycImageMimeType(buffer: Buffer, contentType: KycImageContentType): boolean {
  if (contentType === 'image/jpeg') return hasBytes(buffer, [0xff, 0xd8, 0xff])
  if (contentType === 'image/png') {
    return hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  }
  return buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
}

function hasBytes(buffer: Buffer, bytes: number[]): boolean {
  return buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte)
}

function extensionForContentType(contentType: KycImageContentType): 'jpg' | 'png' | 'webp' {
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  return 'jpg'
}

function normalizeStoredContentType(value: unknown): string {
  return typeof value === 'string' ? value.split(';', 1)[0].trim().toLowerCase() : ''
}

function requireStringConfig(config: ConfigService, key: string): string {
  const value = config.get<string | number>(key)
  const normalized = value === undefined || value === null ? '' : String(value).trim()
  if (!normalized) throw new Error(`${key} is required for private KYC storage`)
  return normalized
}

function numberConfig(
  config: ConfigService,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = config.get<string | number>(key)
  const value = raw === undefined || raw === null || raw === '' ? fallback : Number(raw)
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
