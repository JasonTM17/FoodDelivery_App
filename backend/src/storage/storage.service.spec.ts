import { BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client } from 'minio'
import { StorageService, UploadedFile } from './storage.service'

const mockMinioClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  putObject: jest.fn(),
  removeObject: jest.fn(),
}

jest.mock('minio', () => ({
  Client: jest.fn(() => mockMinioClient),
}))

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMinioClient.bucketExists.mockResolvedValue(true)
    mockMinioClient.makeBucket.mockResolvedValue(undefined)
    mockMinioClient.putObject.mockResolvedValue(undefined)
    mockMinioClient.removeObject.mockResolvedValue(undefined)
  })

  it('uploads image files only after validating the declared MIME against magic bytes', async () => {
    const service = new StorageService(makeConfig())
    const png = makeFile({
      originalname: 'logo.png',
      mimetype: 'image/png',
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
    })

    const result = await service.uploadFile(png, 'restaurants/restaurant-1')

    expect(Client).toHaveBeenCalledWith(expect.objectContaining({
      endPoint: 'localhost',
      accessKey: 'minioadmin',
    }))
    expect(mockMinioClient.putObject).toHaveBeenCalledWith(
      'foodflow',
      expect.stringMatching(/^restaurants\/restaurant-1\/\d+-[a-f0-9]+\.png$/),
      png.buffer,
      png.size,
      { 'Content-Type': 'image/png' },
    )
    expect(result.url).toMatch(/^http:\/\/localhost:9000\/foodflow\/restaurants\/restaurant-1\//)
  })

  it('rejects spoofed image uploads before touching object storage', async () => {
    const service = new StorageService(makeConfig())
    const spoofed = makeFile({
      originalname: 'payload.png',
      mimetype: 'image/png',
      buffer: Buffer.from('not actually a png'),
    })

    await expect(service.uploadFile(spoofed, 'avatars/user-1')).rejects.toThrow(BadRequestException)
    await expect(service.uploadFile(spoofed, 'avatars/user-1')).rejects.toThrow(
      "File content does not match declared MIME type 'image/png'",
    )
    expect(mockMinioClient.putObject).not.toHaveBeenCalled()
  })

  it('honors the configured upload size limit without using a runtime fallback stub', async () => {
    const service = new StorageService(makeConfig({ STORAGE_MAX_UPLOAD_MB: '1' }))
    const file = makeFile({
      originalname: 'large.jpg',
      mimetype: 'image/jpeg',
      size: 1_048_577,
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
    })

    await expect(service.uploadFile(file, 'avatars/user-1')).rejects.toThrow('File size exceeds the 1 MB limit')
    expect(mockMinioClient.putObject).not.toHaveBeenCalled()
  })

  it('does not construct a local object storage client in production when credentials are missing', () => {
    expect(() => new StorageService(makeConfig({
      NODE_ENV: 'production',
      MINIO_ACCESS_KEY: undefined,
    }))).toThrow('MINIO_ACCESS_KEY is required in production')
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

function makeFile(overrides: Partial<UploadedFile>): UploadedFile {
  const buffer = overrides.buffer ?? Buffer.from([0xff, 0xd8, 0xff, 0x00])
  return {
    fieldname: 'file',
    originalname: 'image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer,
    size: buffer.length,
    ...overrides,
  }
}
