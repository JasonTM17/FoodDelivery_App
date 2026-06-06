import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { Request } from 'express'

@Injectable()
export class AccountLockoutGuard implements CanActivate {
  private static readonly MAX_FAILED_ATTEMPTS = 5
  private static readonly LOCKOUT_MINUTES = 15

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const email = request.body?.email

    if (!email) return true

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { lockedUntil: true, failedLoginCount: true },
    })

    if (!user) return true

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const retryAfter = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000)
      throw new HttpException(
        {
          message: 'Account is temporarily locked due to too many failed login attempts',
          retryAfterSeconds: retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    return true
  }
}
