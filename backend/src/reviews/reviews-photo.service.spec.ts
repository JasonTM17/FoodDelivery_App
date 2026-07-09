import { ConfigService } from '@nestjs/config'
import { Client } from 'minio'
import { createClient } from '@supabase/supabase-js'
import { ReviewsPhotoService } from './reviews-photo.service'

const mockMinioClient = {
  presignedPutObject: jest.fn(),
}
const mockSupabaseBucket = {
  createSignedUploadUrl: jest.fn(),
}
const mockSupabaseClient = {
  storage: {
    from: jest.fn(() => mockSupabaseBucket),
  },
}

jest.mock('minio', () => ({
  Client: jest.fn(() => mockMinioClient),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('ReviewsPhotoService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMinioClient.presignedPutObject.mockResolvedValue('https://storage.foodflow.test/upload-url')
    mockSupabaseBucket.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://supabase.storage.test/upload/sign/path?token=abc' },
      error: null,
    })
  })

  it('creates presigned review photo upload URLs with configured object storage', async () => {
    const service = new ReviewsPhotoService(makeConfig())

    const result = await service.getUploadUrl('image/webp')

    expect(Client).toHaveBeenCalledWith(expect.objectContaining({
      endPoint: 'localhost',
      accessKey: 'minioadmin',
    }))
    expect(mockMinioClient.presignedPutObject).toHaveBeenCalledWith(
      'foodflow',
      expect.stringMatching(/^reviews\/photos\/\d+-[a-f0-9]+\.webp$/),
      900,
    )
    expect(result.url).toBe('https://storage.foodflow.test/upload-url')
  })

  it('does not construct a localhost review photo client in production when credentials are missing', () => {
    expect(() => new ReviewsPhotoService(makeConfig({
      NODE_ENV: 'production',
      MINIO_SECRET_KEY: undefined,
    }))).toThrow('MINIO_SECRET_KEY is required in production')
    expect(Client).not.toHaveBeenCalled()
  })

  it('creates Supabase signed upload URLs when STORAGE_PROVIDER=supabase', async () => {
    const service = new ReviewsPhotoService(makeConfig({
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: 'https://lvanszgszzfopusboich.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
      SUPABASE_STORAGE_BUCKET: 'foodflow-production',
    }))

    const result = await service.getUploadUrl('image/avif')

    expect(Client).not.toHaveBeenCalled()
    expect(createClient).toHaveBeenCalledWith(
      'https://lvanszgszzfopusboich.supabase.co',
      'service-role-test-key',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('foodflow-production')
    expect(mockSupabaseBucket.createSignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^reviews\/photos\/\d+-[a-f0-9]+\.avif$/),
    )
    expect(result).toEqual({
      key: expect.stringMatching(/^reviews\/photos\/\d+-[a-f0-9]+\.avif$/),
      url: 'https://supabase.storage.test/upload/sign/path?token=abc',
    })
  })
})

function makeConfig(overrides: Record<string, string | number | undefined> = {}) {
  const values: Record<string, string | number | undefined> = {
    NODE_ENV: 'test',
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: 9000,
    MINIO_ACCESS_KEY: 'minioadmin',
    MINIO_SECRET_KEY: 'minioadmin',
    MINIO_BUCKET: 'foodflow',
    MINIO_PUBLIC_URL: 'http://localhost:9000',
    STORAGE_PROVIDER: 'minio',
    ...overrides,
  }

  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService
}
