import { RefundProcessor } from './refund.processor'
import { PaymentsService } from './payments.service'
import { Job } from 'bullmq'
import { RefundJobData } from './refund.processor'

const makeJob = (data: RefundJobData, attemptsMade = 0): Job<RefundJobData> =>
  ({ data, attemptsMade } as unknown as Job<RefundJobData>)

describe('RefundProcessor', () => {
  let processor: RefundProcessor
  let paymentsService: jest.Mocked<Pick<PaymentsService, 'refundPayment'>>

  beforeEach(() => {
    paymentsService = { refundPayment: jest.fn().mockResolvedValue(undefined) }
    processor = new RefundProcessor(paymentsService as unknown as PaymentsService)
  })

  it('calls paymentsService.refundPayment with the correct orderId', async () => {
    await processor.process(makeJob({ orderId: 'order-1', idempotencyKey: 'k1' }))
    expect(paymentsService.refundPayment).toHaveBeenCalledWith('order-1')
    expect(paymentsService.refundPayment).toHaveBeenCalledTimes(1)
  })

  it('propagates errors so BullMQ can retry', async () => {
    paymentsService.refundPayment.mockRejectedValue(new Error('gateway timeout'))
    await expect(
      processor.process(makeJob({ orderId: 'order-2', idempotencyKey: 'k2' })),
    ).rejects.toThrow('gateway timeout')
  })

  it('handles the first attempt (attemptsMade=0)', async () => {
    await processor.process(makeJob({ orderId: 'order-3', idempotencyKey: 'k3' }, 0))
    expect(paymentsService.refundPayment).toHaveBeenCalledTimes(1)
  })

  it('handles third retry (attemptsMade=2)', async () => {
    await processor.process(makeJob({ orderId: 'order-4', idempotencyKey: 'k4' }, 2))
    expect(paymentsService.refundPayment).toHaveBeenCalledTimes(1)
  })

  it('calls refundPayment regardless of idempotency key value', async () => {
    await processor.process(makeJob({ orderId: 'order-5', idempotencyKey: 'any-key' }))
    expect(paymentsService.refundPayment).toHaveBeenCalledWith('order-5')
  })
})
