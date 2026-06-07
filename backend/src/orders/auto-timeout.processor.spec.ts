import { AutoTimeoutProcessor, IOrdersService, TimeoutJobData } from './auto-timeout.processor'
import { PrismaService } from '../database/prisma.service'
import { Job } from 'bullmq'

const makeJob = (data: TimeoutJobData): Job<TimeoutJobData> =>
  ({ data } as unknown as Job<TimeoutJobData>)

describe('AutoTimeoutProcessor', () => {
  let processor: AutoTimeoutProcessor
  let prismaOrderFindUnique: jest.Mock
  let ordersServiceTransition: jest.Mock

  beforeEach(() => {
    prismaOrderFindUnique = jest.fn()
    ordersServiceTransition = jest.fn().mockResolvedValue({})

    const prisma = {
      order: { findUnique: prismaOrderFindUnique },
    } as unknown as PrismaService

    const ordersService: IOrdersService = { transition: ordersServiceTransition }
    processor = new AutoTimeoutProcessor(prisma, ordersService)
  })

  it('transitions order when still in expected status', async () => {
    prismaOrderFindUnique.mockResolvedValue({ id: 'ord-1', status: 'paid' })
    await processor.process(makeJob({
      orderId: 'ord-1',
      expectedStatus: 'paid',
      targetStatus: 'cancelled',
      reason: 'Restaurant did not accept in time',
    }))
    expect(ordersServiceTransition).toHaveBeenCalledWith(
      'ord-1', 'cancelled', 'system', 'Restaurant did not accept in time',
    )
  })

  it('skips when order already advanced past expected status (idempotency)', async () => {
    prismaOrderFindUnique.mockResolvedValue({ id: 'ord-2', status: 'restaurant_accepted' })
    await processor.process(makeJob({
      orderId: 'ord-2',
      expectedStatus: 'paid',
      targetStatus: 'cancelled',
      reason: 'Timeout',
    }))
    expect(ordersServiceTransition).not.toHaveBeenCalled()
  })

  it('skips gracefully when order not found', async () => {
    prismaOrderFindUnique.mockResolvedValue(null)
    await processor.process(makeJob({
      orderId: 'missing',
      expectedStatus: 'paid',
      targetStatus: 'cancelled',
      reason: 'Timeout',
    }))
    expect(ordersServiceTransition).not.toHaveBeenCalled()
  })

  it('propagates transition errors so BullMQ can retry', async () => {
    prismaOrderFindUnique.mockResolvedValue({ id: 'ord-3', status: 'paid' })
    ordersServiceTransition.mockRejectedValue(new Error('DB error'))
    await expect(processor.process(makeJob({
      orderId: 'ord-3',
      expectedStatus: 'paid',
      targetStatus: 'cancelled',
      reason: 'Timeout',
    }))).rejects.toThrow('DB error')
  })

  it('works for driver_assigned → cancelled timeout scenario', async () => {
    prismaOrderFindUnique.mockResolvedValue({ id: 'ord-4', status: 'driver_assigned' })
    await processor.process(makeJob({
      orderId: 'ord-4',
      expectedStatus: 'driver_assigned',
      targetStatus: 'cancelled',
      reason: 'Driver did not arrive',
    }))
    expect(ordersServiceTransition).toHaveBeenCalledWith(
      'ord-4', 'cancelled', 'system', 'Driver did not arrive',
    )
  })
})
