import { JwtAuthGuard } from './jwt-auth.guard'
import { Reflector } from '@nestjs/core'
import { ExecutionContext } from '@nestjs/common'

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
    guard = new JwtAuthGuard(reflector)
  })

  it('allows public routes without auth', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true)
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({}) }),
    }
    expect(guard.canActivate(context as ExecutionContext)).toBe(true)
  })

  it('throws for missing token on protected route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
    }
    expect(() => guard['handleRequest'](null, null)).toThrow()
  })
})
