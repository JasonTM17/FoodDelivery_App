import { TicketPriority } from '@prisma/client'
import { calculateSupportSlaDeadline, shiftDeadlineForWaiting } from './support-sla'

describe('support SLA calculations', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('counts only ICT business hours from Monday through Saturday', () => {
    const createdAt = new Date('2026-06-01T04:00:00.000Z') // Monday 11:00 ICT.

    const deadline = calculateSupportSlaDeadline(createdAt, TicketPriority.high)

    expect(deadline.toISOString()).toBe('2026-06-01T08:00:00.000Z')
  })

  it('carries remaining SLA minutes across Saturday close and skips Sunday', () => {
    const createdAt = new Date('2026-06-06T12:00:00.000Z') // Saturday 19:00 ICT.

    const deadline = calculateSupportSlaDeadline(createdAt, TicketPriority.high)

    expect(deadline.toISOString()).toBe('2026-06-08T04:00:00.000Z')
  })

  it('moves tickets created on Sunday to the next Monday opening window', () => {
    const createdAt = new Date('2026-06-07T03:00:00.000Z') // Sunday 10:00 ICT.

    const deadline = calculateSupportSlaDeadline(createdAt, TicketPriority.critical)

    expect(deadline.toISOString()).toBe('2026-06-08T02:00:00.000Z')
  })

  it('pauses an existing deadline while the ticket waits for the customer', () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-06-02T09:30:00.000Z').getTime())

    const shifted = shiftDeadlineForWaiting(
      new Date('2026-06-02T08:00:00.000Z'),
      new Date('2026-06-02T07:00:00.000Z'),
    )

    expect(shifted?.toISOString()).toBe('2026-06-02T10:30:00.000Z')
  })
})
