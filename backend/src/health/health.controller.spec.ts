import { Test, TestingModule } from '@nestjs/testing'
import { Response } from 'express'
import { HealthController } from './health.controller'
import { PrismaService } from '../database/prisma.service'

describe('HealthController', () => {
  let controller: HealthController
  let mockPrisma: { $queryRaw: jest.Mock }
  let mockRedis: { ping: jest.Mock }

  beforeEach(async () => {
    mockPrisma = { $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]) }
    mockRedis = { ping: jest.fn().mockResolvedValue('PONG') }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
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
    expect(res.json.mock.calls[0][0].components.redis.status).toBe('up')
  })

  it('returns degraded when redis is down', async () => {
    mockRedis.ping.mockRejectedValueOnce(new Error('Redis down'))
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    await controller.check(res as unknown as Response)
    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json.mock.calls[0][0].components.redis.status).toBe('down')
  })
})
