import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { HealthController } from './health.controller'
import { PrismaService } from '../database/prisma.service'

jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: jest.fn().mockResolvedValue(true),
  })),
}))

describe('HealthController', () => {
  let controller: HealthController
  let mockPrisma: { $queryRaw: jest.Mock }
  let mockRedis: { ping: jest.Mock }
  let mockConfig: { get: jest.Mock }

  beforeEach(async () => {
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
    const jsonArg = res.json.mock.calls[0][0]
    expect(jsonArg.status).toBe('ok')
    expect(jsonArg.components.db.status).toBe('up')
    expect(jsonArg.components.redis.status).toBe('up')
    expect(jsonArg.uptime).toBeGreaterThan(0)
    expect(jsonArg.timestamp).toBeDefined()
  })

  it('returns degraded when db is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB down'))
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    await controller.check(res as unknown as Response)
    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json.mock.calls[0][0].status).toBe('degraded')
    expect(res.json.mock.calls[0][0].components.db.status).toBe('down')
  })

  it('returns degraded when redis is down', async () => {
    mockRedis.ping.mockRejectedValueOnce(new Error('Redis down'))
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    await controller.check(res as unknown as Response)
    expect(res.status).toHaveBeenCalledWith(503)
  })
})
