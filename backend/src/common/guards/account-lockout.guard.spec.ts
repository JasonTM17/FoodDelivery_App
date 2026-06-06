import { ExecutionContext, HttpException } from '@nestjs/common'
import { AccountLockoutGuard } from './account-lockout.guard'

function makeContext(body: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ body }),
    }),
  } as unknown as ExecutionContext
}

describe('AccountLockoutGuard', () => {
  let guard: AccountLockoutGuard
  let prisma: { user: { findUnique: jest.Mock } }

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } }
    guard = new AccountLockoutGuard(prisma as never)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns true and skips DB when no email in body', async () => {
    const result = await guard.canActivate(makeContext({}))
    expect(result).toBe(true)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('returns true when user record not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    const result = await guard.canActivate(makeContext({ email: 'unknown@test.com' }))
    expect(result).toBe(true)
  })

  it('returns true when lockedUntil is null', async () => {
    prisma.user.findUnique.mockResolvedValue({ lockedUntil: null, failedLoginCount: 3 })
    const result = await guard.canActivate(makeContext({ email: 'user@test.com' }))
    expect(result).toBe(true)
  })

  it('returns true when lock timestamp is in the past (expired)', async () => {
    const expired = new Date(Date.now() - 60_000)
    prisma.user.findUnique.mockResolvedValue({ lockedUntil: expired, failedLoginCount: 5 })
    const result = await guard.canActivate(makeContext({ email: 'user@test.com' }))
    expect(result).toBe(true)
  })

  it('throws HttpException with status 429 when account locked', async () => {
    const future = new Date(Date.now() + 900_000)
    prisma.user.findUnique.mockResolvedValue({ lockedUntil: future, failedLoginCount: 5 })
    await expect(guard.canActivate(makeContext({ email: 'locked@test.com' }))).rejects.toThrow(HttpException)
  })

  it('locked response includes retryAfterSeconds > 0', async () => {
    const future = new Date(Date.now() + 300_000)
    prisma.user.findUnique.mockResolvedValue({ lockedUntil: future, failedLoginCount: 5 })
    let caught: HttpException | undefined
    try {
      await guard.canActivate(makeContext({ email: 'locked@test.com' }))
    } catch (err) {
      caught = err as HttpException
    }
    expect(caught!.getStatus()).toBe(429)
    const body = caught!.getResponse() as Record<string, unknown>
    expect(typeof body.retryAfterSeconds).toBe('number')
    expect(body.retryAfterSeconds as number).toBeGreaterThan(0)
  })

  it('locked response includes descriptive message', async () => {
    const future = new Date(Date.now() + 60_000)
    prisma.user.findUnique.mockResolvedValue({ lockedUntil: future, failedLoginCount: 5 })
    let caught: HttpException | undefined
    try {
      await guard.canActivate(makeContext({ email: 'locked@test.com' }))
    } catch (err) {
      caught = err as HttpException
    }
    const body = caught!.getResponse() as Record<string, unknown>
    expect(typeof body.message).toBe('string')
    expect((body.message as string).length).toBeGreaterThan(0)
  })

  it('queries prisma with exact email and correct select', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    await guard.canActivate(makeContext({ email: 'test@example.com' }))
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: { lockedUntil: true, failedLoginCount: true },
    })
  })

  it('retryAfterSeconds is rounded up to nearest second', async () => {
    const future = new Date(Date.now() + 90_500) // 90.5 seconds ahead
    prisma.user.findUnique.mockResolvedValue({ lockedUntil: future, failedLoginCount: 5 })
    let caught: HttpException | undefined
    try {
      await guard.canActivate(makeContext({ email: 'x@test.com' }))
    } catch (err) {
      caught = err as HttpException
    }
    const body = caught!.getResponse() as Record<string, unknown>
    expect(body.retryAfterSeconds as number).toBeGreaterThanOrEqual(90)
  })
})
