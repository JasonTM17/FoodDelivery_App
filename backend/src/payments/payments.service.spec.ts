import { Test, TestingModule } from '@nestjs/testing'
import { PaymentsService } from '../orders/payments.service'
import { PrismaService } from '../database/prisma.service'
import { getQueueToken } from '@nestjs/bullmq'

describe('PaymentsService', () => {
  let service: PaymentsService

  const mockPrisma = {
    order: { findUniqueOrThrow: jest.fn().mockResolvedValue({ status: 'created' }) },
    payment: { create: jest.fn().mockResolvedValue({ id: 'pay-1', status: 'pending' }), update: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('dispatch'), useValue: { add: jest.fn() } },
      ],
    }).compile()
    service = module.get(PaymentsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
