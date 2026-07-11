import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { Client } from 'minio'
import { createClient } from '@supabase/supabase-js'
import { HealthController } from './health.controller'
import { PrismaService } from '../database/prisma.service'

const mockSupabaseGetBucket = jest.fn()

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: jest.fn().mockResolvedValue(true),
  })),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      getBucket: mockSupabaseGetBucket,
    },
  })),
}))

describe('HealthController', () => {
  let controller: HealthController
  let mockPrisma: { $queryRaw: jest.Mock }
  let mockRedis: { ping: jest.Mock }
  let mockConfig: { get: jest.Mock }

  beforeEach(async () => {
    jest.clearAllMocks()
    mockSupabaseGetBucket.mockResolvedValue({
      data: { id: 'foodflow-production' },
      error: null,
    })
    mockPrisma = { $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]) }
    mockRedis = { ping: jest.fn().mockResolvedValue('PONG') }
    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'MINIO_ENDPOINT') return 'localhost'
        if (key === 'MINIO_PORT') return 9000
        if (key === 'MINIO_ACCESS_KEY') return 'minioadmin'
        if (key === 'MINIO_SECRET_KEY') return 'minioadmin'
        if (key === 'MINIO_BUCKET') return 'foodflow'
        return null
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile()

    controller = module.get<HealthController>(HealthController)
  })

  it('returns ok when all components are up', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    await controller.check(res as unknown as Response)
    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('ok')
    expect(body.components.db.status).toBe('up')
    expect(body.components.redis.status).toBe('up')
    expect(body.components.storage).toMatchObject({
      provider: 'minio',
      status: 'up',
    })
    expect(body.uptime).toBeGreaterThan(0)
    expect(body.timestamp).toBeDefined()
  })

  it('returns 503 degraded when database is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB down'))
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await controller.check(res as unknown as Response)

    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json.mock.calls[0][0].status).toBe('degraded')
    expect(res.json.mock.calls[0][0].components.db.status).toBe('down')
  })

  it('returns 503 degraded when Redis is down', async () => {
    mockRedis.ping.mockRejectedValueOnce(new Error('Redis down'))
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await controller.check(res as unknown as Response)

    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json.mock.calls[0][0].status).toBe('degraded')
  })

  it('returns 200 degraded when only MinIO is down', async () => {
    ;(Client as unknown as jest.Mock).mockImplementationOnce(() => ({
      bucketExists: jest.fn().mockRejectedValue(new Error('MinIO down')),
    }))
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await controller.check(res as unknown as Response)

    expect(res.status).toHaveBeenCalledWith(200)
    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('degraded')
    expect(body.components.db.status).toBe('up')
    expect(body.components.redis.status).toBe('up')
    expect(body.components.storage).toMatchObject({
      provider: 'minio',
      status: 'down',
    })
  })

  it('returns ready when every configured dependency is up', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await controller.readiness(res as unknown as Response)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toMatchObject({
      status: 'ready',
      ready: true,
      components: {
        db: { status: 'up' },
        redis: { status: 'up' },
        storage: { provider: 'minio', status: 'up' },
      },
    })
  })

  it('returns 503 not_ready when storage is down', async () => {
    ;(Client as unknown as jest.Mock).mockImplementationOnce(() => ({
      bucketExists: jest.fn().mockRejectedValue(new Error('MinIO down')),
    }))
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await controller.readiness(res as unknown as Response)

    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json.mock.calls[0][0]).toMatchObject({
      status: 'not_ready',
      ready: false,
      components: { storage: { status: 'down' } },
    })
  })

  it('does not construct a localhost MinIO client when production storage env is missing', async () => {
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production'
      if (key === 'MINIO_PORT') return 9000
      if (key === 'MINIO_BUCKET') return 'foodflow'
      return undefined
    })
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await controller.check(res as unknown as Response)

    expect(Client).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toMatchObject({
      status: 'degraded',
      components: {
        storage: { provider: 'minio', status: 'down' },
      },
    })
  })

  it('checks Supabase Storage instead of MinIO when configured', async () => {
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'STORAGE_PROVIDER') return 'supabase'
      if (key === 'SUPABASE_URL') return 'https://foodflow.supabase.co'
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-role-key'
      if (key === 'SUPABASE_STORAGE_BUCKET') return 'foodflow-production'
      return null
    })
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await controller.check(res as unknown as Response)

    expect(Client).not.toHaveBeenCalled()
    expect(createClient).toHaveBeenCalledWith(
      'https://foodflow.supabase.co',
      'service-role-key',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    expect(mockSupabaseGetBucket).toHaveBeenCalledWith('foodflow-production')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].components.storage).toMatchObject({
      provider: 'supabase',
      status: 'up',
    })
  })

  it('returns 200 degraded when only Supabase Storage is down', async () => {
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'STORAGE_PROVIDER') return 'supabase'
      if (key === 'SUPABASE_URL') return 'https://foodflow.supabase.co'
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-role-key'
      if (key === 'SUPABASE_STORAGE_BUCKET') return 'foodflow-production'
      return null
    })
    mockSupabaseGetBucket.mockResolvedValueOnce({
      data: null,
      error: new Error('bucket missing'),
    })
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    await controller.check(res as unknown as Response)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toMatchObject({
      status: 'degraded',
      components: {
        storage: { provider: 'supabase', status: 'down' },
      },
    })
  })
})
