import { ConfigService } from '@nestjs/config'
import { Client } from 'minio'
import { ReviewsPhotoService } from './reviews-photo.service'

const mockMinioClient = {
  presignedPutObject: jest.fn(),
}

jest.mock('minio', () => ({
  Client: jest.fn(() => mockMinioClient),
}))

describe('ReviewsPhotoService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMinioClient.presignedPutObject.mockResolvedValue('https://storage.foodflow.test/upload-url')
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
    ...overrides,
  }

  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService
}
