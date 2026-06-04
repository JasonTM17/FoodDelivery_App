import { RolesGuard } from './roles.guard'
import { Reflector } from '@nestjs/core'

describe('RolesGuard', () => {
  let guard: RolesGuard
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
    guard = new RolesGuard(reflector)
  })

  it('allows access when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'customer' } }) }),
    }
    expect(guard.canActivate(context as unknown as Parameters<typeof guard.canActivate>[0])).toBe(true)
  })

  it('denies access when role does not match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'])
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'customer' } }) }),
    }
    expect(guard.canActivate(context as unknown as Parameters<typeof guard.canActivate>[0])).toBe(false)
  })

  it('allows access when role matches', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'])
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'admin' } }) }),
    }
    expect(guard.canActivate(context as unknown as Parameters<typeof guard.canActivate>[0])).toBe(true)
  })
})
