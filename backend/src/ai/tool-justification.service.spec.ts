import { Logger } from '@nestjs/common'
import { ToolJustificationService } from './tool-justification.service'

describe('ToolJustificationService', () => {
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('allows angry long-delay messages to create support tickets', () => {
    const service = new ToolJustificationService()

    expect(service.validate(
      'createSupportTicket',
      'Đơn FF-002 đợi 1 tiếng rồi! Quá tệ!',
      'HIGH',
    )).toBe(true)
  })

  it('does not treat a short refund-delay question as support-ticket intent', () => {
    const service = new ToolJustificationService()

    expect(service.validate(
      'createSupportTicket',
      'Tôi muốn hoàn tiền vì delay 5 phút',
      'LOW',
    )).toBe(false)
  })
})
