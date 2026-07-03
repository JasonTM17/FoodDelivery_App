import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { UserRole } from '@prisma/client'
import { Queue } from 'bullmq'
import * as bcrypt from 'bcrypt'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { PrismaService } from '../database/prisma.service'
import { RegisterDto, LoginDto, RefreshDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto'
import { UsersService } from '../users/users.service'
import { RefreshTokenStore } from './refresh-token.store'
import { QUEUE_SMTP } from '../notifications/notifications.constants'
import type { SmtpJobData } from '../notifications/channels/smtp.channel'

// ─── Types ──────────────────────────────────────────────────────────────────

export type SanitizedUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
  phone: string | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: Date
}

export interface JwtPayload {
  sub: string
  role: UserRole
  type?: 'access' | 'refresh'
  jti?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: SanitizedUser
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  private static readonly BCRYPT_ROUNDS = 12
  private static readonly ACCESS_TOKEN_TTL = '15m'
  private static readonly REFRESH_TOKEN_TTL = '7d'
  private static readonly PASSWORD_RESET_TTL_MINUTES = 60
  private static readonly PASSWORD_RESET_MESSAGE =
    'If an account exists, password reset instructions will be sent when email delivery is configured.'

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly refreshTokenStore: RefreshTokenStore,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_SMTP) private readonly smtpQueue: Queue<SmtpJobData>,
  ) {}

  // ─── Public API ───────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResult> {
    const { email, password, fullName, phone, role = UserRole.customer } = dto

    const existing = await this.usersService.findByEmail(email)
    if (existing) {
      throw new ConflictException('An account with this email already exists')
    }

    const passwordHash = await bcrypt.hash(password, AuthService.BCRYPT_ROUNDS)

    const user = await this.usersService.create({
      email,
      passwordHash,
      fullName,
      phone,
      role,
    })

    // Create role-specific profile
    if (role === UserRole.customer) {
      await this.prisma.customerProfile.create({ data: { userId: user.id } })
    } else if (role === UserRole.driver) {
      await this.prisma.driverProfile.create({ data: { userId: user.id } })
    }
    // restaurant and admin profiles are created during onboarding

    return this.buildAuthResult(user)
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) {
      throw new UnauthorizedException('Invalid email or password')
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Contact support.')
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const retryAfter = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000)
      throw new UnauthorizedException(
        `Account is temporarily locked. Please try again in ${retryAfter} seconds.`,
      )
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) {
      const newCount = (user.failedLoginCount ?? 0) + 1
      if (newCount >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: newCount, lockedUntil },
        })
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: newCount },
        })
      }
      throw new UnauthorizedException('Invalid email or password')
    }

    // Reset lockout counters on successful login
    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      })
    }

    return this.buildAuthResult(user)
  }

  async refresh(dto: RefreshDto): Promise<AuthResult> {
    let payload: JwtPayload & { type?: string; jti?: string }
    try {
      payload = this.jwtService.verify(dto.refreshToken)
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    if (await this.refreshTokenStore.isBlocklisted(payload.jti)) {
      throw new UnauthorizedException('Refresh token has been revoked')
    }

    const user = await this.usersService.findById(payload.sub)
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or account is inactive')
    }

    // Blocklist old refresh token (rotation)
    await this.refreshTokenStore.blocklist(payload.jti)

    return this.buildAuthResult(user)
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return

    try {
      const payload = this.jwtService.verify<JwtPayload & { type?: string; jti?: string }>(refreshToken)
      if (payload.type === 'refresh' && payload.jti) {
        await this.refreshTokenStore.blocklist(payload.jti)
      }
    } catch {
      // Silently ignore invalid tokens during logout
    }
  }

  async requestPasswordReset(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase()
    const user = await this.usersService.findByEmail(email)

    if (!user || !user.isActive) {
      return { message: AuthService.PASSWORD_RESET_MESSAGE }
    }

    const rawToken = randomBytes(32).toString('base64url')
    const tokenHash = this.hashPasswordResetToken(rawToken)
    const ttlMinutes = this.getPasswordResetTtlMinutes()
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    })
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    })

    await this.enqueuePasswordResetEmail(user.id, rawToken, ttlMinutes)

    return { message: AuthService.PASSWORD_RESET_MESSAGE }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashPasswordResetToken(dto.token)
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    })

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= Date.now() ||
      !resetToken.user.isActive
    ) {
      throw new BadRequestException('Invalid or expired password reset token')
    }

    const passwordHash = await bcrypt.hash(dto.password, AuthService.BCRYPT_ROUNDS)
    const usedAt = new Date()

    await this.prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      })
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt },
      })
    })

    return { message: 'Password reset successful' }
  }

  /**
   * Used by JwtStrategy to resolve a user from a validated JWT payload.
   */
  async validateUser(userId: string): Promise<SanitizedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!user || !user.isActive) return null
    return user
  }

  // ─── Token Management ─────────────────────────────────────────────────────

  private async buildAuthResult(user: { id: string; role: UserRole }): Promise<AuthResult> {
    const tokenPair = await this.generateTokens(user)
    const sanitized = await this.validateUser(user.id)
    return { ...tokenPair, user: sanitized! }
  }

  private async generateTokens(user: { id: string; role: UserRole }): Promise<TokenPair> {
    const basePayload: Pick<JwtPayload, 'sub' | 'role'> = {
      sub: user.id,
      role: user.role,
    }

    const accessToken = this.jwtService.sign(
      { ...basePayload, type: 'access' },
      { expiresIn: AuthService.ACCESS_TOKEN_TTL },
    )

    const refreshToken = this.jwtService.sign(
      { ...basePayload, type: 'refresh', jti: randomUUID() },
      { expiresIn: AuthService.REFRESH_TOKEN_TTL },
    )

    return { accessToken, refreshToken }
  }

  private hashPasswordResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private getPasswordResetTtlMinutes(): number {
    const configured = this.config.get<number>('PASSWORD_RESET_TOKEN_TTL_MINUTES')
    return configured && configured > 0 ? configured : AuthService.PASSWORD_RESET_TTL_MINUTES
  }

  private buildPasswordResetUrl(token: string): string {
    const baseUrl = this.config.get<string>('PASSWORD_RESET_URL_BASE')?.trim() || 'http://localhost:3000/reset-password'
    const url = new URL(baseUrl)
    url.searchParams.set('token', token)
    return url.toString()
  }

  private async enqueuePasswordResetEmail(userId: string, token: string, ttlMinutes: number): Promise<void> {
    try {
      const resetUrl = this.buildPasswordResetUrl(token)
      await this.smtpQueue.add(
        'send-email',
        {
          userId,
          title: 'FoodFlow password reset',
          body: `We received a password reset request for your FoodFlow account. Use this secure link within ${ttlMinutes} minutes: ${resetUrl}. If you did not request this, you can ignore this email.`,
          critical: true,
        } satisfies SmtpJobData,
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.logger.error(`Password reset email enqueue failed for user ${userId}: ${msg}`)
    }
  }
}
