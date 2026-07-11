import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@supabase/supabase-js'
import { Client } from 'minio'
import { Readable } from 'stream'
import { DriverKycStorageService, matchesKycImageMimeType } from './driver-kyc-storage.service'
import type { KycDocumentObjects } from './driver-kyc.zod'

const mockMinio = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  presignedPutObject: jest.fn(),
  presignedGetObject: jest.fn(),
  statObject: jest.fn(),
  getPartialObject: jest.fn(),
}
const mockSupabaseBucket = {
  createSignedUploadUrl: jest.fn(),
  createSignedUrl: jest.fn(),
  info: jest.fn(),
  download: jest.fn(),
}
const mockSupabase = {
  storage: { from: jest.fn(() => mockSupabaseBucket) },
}

jest.mock('minio', () => ({ Client: jest.fn(() => mockMinio) }))
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => mockSupabase) }))

describe('DriverKycStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMinio.bucketExists.mockResolvedValue(true)
    mockMinio.presignedPutObject.mockResolvedValue('https://minio.test/signed-put')
    mockMinio.presignedGetObject.mockResolvedValue('https://minio.test/signed-get')
    mockSupabaseBucket.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://supabase.test/signed-put' },
      error: null,
    })
    mockSupabaseBucket.createSignedUrl.mockImplementation((path: string) => Promise.resolve({
      data: { signedUrl: `https://supabase.test/signed-get/${encodeURIComponent(path)}` },
      error: null,
    }))
    mockSupabaseBucket.info.mockResolvedValue({
      data: { size: 1024, contentType: 'image/jpeg' },
      error: null,
    })
    mockSupabaseBucket.download.mockResolvedValue({
      data: new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' }),
      error: null,
    })
  })

  it('creates owner-scoped Supabase signed uploads in the private KYC bucket', async () => {
    const service = new DriverKycStorageService(makeConfig({
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
      SUPABASE_KYC_BUCKET: 'foodflow-kyc',
    }))

    const grant = await service.createUploadGrant(
      'driver-1',
      'idCardFront',
      'image/jpeg',
      1024,
    )

    expect(Client).not.toHaveBeenCalled()
    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'service-role-test-key',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('foodflow-kyc')
    expect(grant).toEqual({
      uploadUrl: 'https://supabase.test/signed-put',
      objectKey: expect.stringMatching(
        /^kyc\/driver-1\/\d{13}-[a-f0-9]{24}-idCardFront\.jpg$/,
      ),
      headers: {
        'cache-control': 'private, max-age=0, no-store',
        'content-type': 'image/jpeg',
        'x-upsert': 'false',
      },
    })
  })

  it('rejects unsupported and oversized uploads before contacting storage', async () => {
    const service = new DriverKycStorageService(makeConfig())

    await expect(service.createUploadGrant(
      'driver-1',
      'idCardFront',
      'image/jpeg',
      128,
    )).rejects.toThrow(new BadRequestException('KYC_DOCUMENT_SIZE_INVALID'))
    await expect(service.createUploadGrant(
      'driver-1',
      'idCardFront',
      'image/jpeg',
      4 * 1024 * 1024 + 1,
    )).rejects.toThrow(new BadRequestException('KYC_DOCUMENT_SIZE_INVALID'))
    expect(mockMinio.presignedPutObject).not.toHaveBeenCalled()
  })

  it('reports storage signing outages as unavailable instead of invalid user input', async () => {
    mockSupabaseBucket.createSignedUploadUrl.mockRejectedValueOnce(new Error('provider down'))
    const service = new DriverKycStorageService(makeConfig({
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
      SUPABASE_KYC_BUCKET: 'foodflow-kyc',
    }))

    await expect(service.createUploadGrant(
      'driver-1',
      'idCardFront',
      'image/jpeg',
      1024,
    )).rejects.toThrow(new ServiceUnavailableException('KYC_STORAGE_UNAVAILABLE'))
  })

  it('rejects another driver object key before fetching private data', async () => {
    const service = new DriverKycStorageService(makeConfig({
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
      SUPABASE_KYC_BUCKET: 'foodflow-kyc',
    }))
    const documents = makeDocuments('another-driver')

    await expect(service.validateSubmissionObjects('driver-1', documents))
      .rejects.toThrow(new BadRequestException('KYC_DOCUMENT_OWNERSHIP_INVALID'))
    expect(mockSupabaseBucket.info).not.toHaveBeenCalled()
  })

  it('checks every Supabase object and returns only short-lived admin read URLs', async () => {
    const service = new DriverKycStorageService(makeConfig({
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
      SUPABASE_KYC_BUCKET: 'foodflow-kyc',
    }))
    const documents = makeDocuments('driver-1')

    await expect(service.validateSubmissionObjects('driver-1', documents)).resolves.toBeUndefined()
    const urls = await service.createSignedReadUrls('driver-1', documents)

    expect(mockSupabaseBucket.info).toHaveBeenCalledTimes(4)
    expect(mockSupabaseBucket.download).toHaveBeenCalledTimes(4)
    expect(mockSupabaseBucket.createSignedUrl).toHaveBeenCalledTimes(4)
    expect(urls.idCardFront).toContain('https://supabase.test/signed-get/')
    expect(Object.values(urls).some(value => value.startsWith('kyc/'))).toBe(false)
  })

  it('does not sign an object key owned by another driver', async () => {
    const service = new DriverKycStorageService(makeConfig({
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
      SUPABASE_KYC_BUCKET: 'foodflow-kyc',
    }))

    await expect(service.createSignedReadUrls('driver-1', makeDocuments('driver-2')))
      .rejects.toThrow(new BadRequestException('KYC_DOCUMENT_OWNERSHIP_INVALID'))
    expect(mockSupabaseBucket.createSignedUrl).not.toHaveBeenCalled()
  })

  it('rejects MIME spoofing after downloading the object signature', async () => {
    mockSupabaseBucket.download.mockResolvedValueOnce({
      data: new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47])], { type: 'image/jpeg' }),
      error: null,
    })
    const service = new DriverKycStorageService(makeConfig({
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
      SUPABASE_KYC_BUCKET: 'foodflow-kyc',
    }))

    await expect(service.validateSubmissionObjects('driver-1', makeDocuments('driver-1')))
      .rejects.toThrow(new BadRequestException('KYC_DOCUMENT_SIGNATURE_INVALID'))
  })

  it('keeps local MinIO KYC files in a dedicated bucket and validates partial bytes', async () => {
    mockMinio.statObject.mockResolvedValue({
      size: 1024,
      metaData: { 'content-type': 'image/jpeg' },
    })
    mockMinio.getPartialObject.mockImplementation(() => Promise.resolve(
      Readable.from([Buffer.from([0xff, 0xd8, 0xff, 0xe0])]),
    ))
    const service = new DriverKycStorageService(makeConfig())

    await expect(service.validateSubmissionObjects('driver-1', makeDocuments('driver-1')))
      .resolves.toBeUndefined()
    expect(mockMinio.statObject).toHaveBeenCalledWith(
      'foodflow-kyc',
      expect.stringMatching(/^kyc\/driver-1\//),
    )
    expect(mockMinio.getPartialObject).toHaveBeenCalledTimes(4)
  })

  it('recognizes only the declared image signature', () => {
    expect(matchesKycImageMimeType(Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg')).toBe(true)
    expect(matchesKycImageMimeType(Buffer.from('RIFF0000WEBP'), 'image/webp')).toBe(true)
    expect(matchesKycImageMimeType(Buffer.from([0xff, 0xd8, 0xff]), 'image/png')).toBe(false)
  })
})

function makeDocuments(driverId: string): KycDocumentObjects {
  const prefix = `kyc/${driverId}/1730000000000-0123456789abcdef01234567`
  return {
    idCardFront: `${prefix}-idCardFront.jpg`,
    idCardBack: `${prefix}-idCardBack.jpg`,
    driverLicense: `${prefix}-driverLicense.jpg`,
    vehicleRegistration: `${prefix}-vehicleRegistration.jpg`,
  }
}

function makeConfig(overrides: Record<string, string | number | undefined> = {}) {
  const values: Record<string, string | number | undefined> = {
    NODE_ENV: 'test',
    STORAGE_PROVIDER: 'minio',
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: 9000,
    MINIO_ACCESS_KEY: 'minioadmin',
    MINIO_SECRET_KEY: 'minioadmin',
    MINIO_KYC_BUCKET: 'foodflow-kyc',
    DRIVER_KYC_MAX_UPLOAD_MB: 4,
    ...overrides,
  }
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService
}
