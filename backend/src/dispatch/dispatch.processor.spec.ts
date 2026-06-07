import { Test, TestingModule } from '@nestjs/testing'
import { DispatchProcessor } from './dispatch.processor'
import { DispatchService } from './dispatch.service'
import { getQueueToken } from '@nestjs/bullmq'

describe('DispatchProcessor', () => {
  let processor: DispatchProcessor

  const mockDispatchService = {
    dispatchOrder: jest.fn(),
    autoCancelOrder: jest.fn().mockResolvedValue(undefined),
  }

  const mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job-2' }) }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchProcessor,
        { provide: DispatchService, useValue: mockDispatchService },
        { provide: getQueueToken('dispatch'), useValue: mockQueue },
      ],
    }).compile()
    processor = module.get(DispatchProcessor)
  })

  it('should be defined', () => {
    expect(processor).toBeDefined()
  })

  describe('process — radius escalation', () => {
    const baseData = { orderId: 'order-1', restaurantLat: 10.8, restaurantLng: 106.7, attempt: 1 }

    it('uses 3km radius on attempt 1', async () => {
      mockDispatchService.dispatchOrder.mockResolvedValue({ assigned: true, driverId: 'd1' })
      await processor.process({ id: 'j1', data: { ...baseData, attempt: 1 } } as never)
      expect(mockDispatchService.dispatchOrder).toHaveBeenCalledWith('order-1', 10.8, 106.7, 3, 1)
    })

    it('uses 5km radius on attempt 2', async () => {
      mockDispatchService.dispatchOrder.mockResolvedValue({ assigned: true, driverId: 'd1' })
      await processor.process({ id: 'j1', data: { ...baseData, attempt: 2 } } as never)
      expect(mockDispatchService.dispatchOrder).toHaveBeenCalledWith('order-1', 10.8, 106.7, 5, 2)
    })

    it('uses 8km radius on attempt 3', async () => {
      mockDispatchService.dispatchOrder.mockResolvedValue({ assigned: true, driverId: 'd1' })
      await processor.process({ id: 'j1', data: { ...baseData, attempt: 3 } } as never)
      expect(mockDispatchService.dispatchOrder).toHaveBeenCalledWith('order-1', 10.8, 106.7, 8, 3)
    })

    it('still uses 8km for attempts beyond 3', async () => {
      mockDispatchService.dispatchOrder.mockResolvedValue({ assigned: true, driverId: 'd1' })
      await processor.process({ id: 'j1', data: { ...baseData, attempt: 4 } } as never)
      expect(mockDispatchService.dispatchOrder).toHaveBeenCalledWith('order-1', 10.8, 106.7, 8, 4)
    })
  })

  describe('process — requeue and cancel logic', () => {
    const baseData = { orderId: 'order-1', restaurantLat: 10.8, restaurantLng: 106.7, attempt: 1 }

    it('requeues with attempt+1 and correct jobId when not assigned below max', async () => {
      mockDispatchService.dispatchOrder.mockResolvedValue({ assigned: false })
      await processor.process({ id: 'j1', data: baseData } as never)
      expect(mockQueue.add).toHaveBeenCalledWith(
        'dispatch.driver',
        expect.objectContaining({ orderId: 'order-1', attempt: 2 }),
        expect.objectContaining({ jobId: 'dispatch:order-1:2' }),
      )
    })

    it('calls autoCancelOrder on attempt 5 (max) instead of requeue', async () => {
      mockDispatchService.dispatchOrder.mockResolvedValue({ assigned: false })
      await processor.process({ id: 'j1', data: { ...baseData, attempt: 5 } } as never)
      expect(mockDispatchService.autoCancelOrder).toHaveBeenCalledWith('order-1')
      expect(mockQueue.add).not.toHaveBeenCalled()
    })

    it('does not requeue when a driver is successfully assigned', async () => {
      mockDispatchService.dispatchOrder.mockResolvedValue({ assigned: true, driverId: 'd1' })
      await processor.process({ id: 'j1', data: baseData } as never)
      expect(mockQueue.add).not.toHaveBeenCalled()
      expect(mockDispatchService.autoCancelOrder).not.toHaveBeenCalled()
    })

    it('returns the dispatch result from the service', async () => {
      mockDispatchService.dispatchOrder.mockResolvedValue({ assigned: true, driverId: 'd-xyz' })
      const result = await processor.process({ id: 'j1', data: baseData } as never)
      expect(result).toEqual({ assigned: true, driverId: 'd-xyz' })
    })
  })
})
