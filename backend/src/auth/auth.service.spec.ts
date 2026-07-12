import { Test, TestingModule } from '@nestjs/testing'
import { getQueueToken } from '@nestjs/bullmq'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common'
import { createHash } from 'crypto'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { PrismaService } from '../database/prisma.service'
import { RefreshTokenStore } from './refresh-token.store'
import { Ed25519Service } from './keys/ed25519.service'
import { QUEUE_SMTP } from '../notifications/notifications.constants'

describe('AuthService', () => {
  let service: AuthService

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  }

  const mockPrisma = {
    customerProfile: { create: jest.fn() },
    driverProfile: { create: jest.fn() },
    passwordResetToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  }

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  }

  const mockConfigValues: Record<string, string | number> = {
    NODE_ENV: 'test',
    PASSWORD_RESET_TOKEN_TTL_MINUTES: 60,
    PASSWORD_RESET_URL_BASE: 'https://admin.foodflow.test/reset-password',
    JWT_SECRET: 'test-secret',
  }

  const mockConfig = {
    get: jest.fn((key: string) => mockConfigValues[key]),
  }

  const mockRefreshTokenStore = {
    blocklist: jest.fn(),
    isBlocklisted: jest.fn(),
    blocklistIfNew: jest.fn().mockResolvedValue(true),
    revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    isUserRevoked: jest.fn().mockResolvedValue(false),
  }

  const mockEd25519 = {
    canSign: jest.fn().mockReturnValue(false),
    getPrivateKey: jest.fn().mockReturnValue(null),
    kid: 'ed25519-primary',
  }

  const mockSmtpQueue = {
    add: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    Object.keys(mockConfigValues).forEach(key => delete mockConfigValues[key])
    Object.assign(mockConfigValues, {
      NODE_ENV: 'test',
      PASSWORD_RESET_TOKEN_TTL_MINUTES: 60,
      PASSWORD_RESET_URL_BASE: 'https://admin.foodflow.test/reset-password',
      JWT_SECRET: 'test-secret',
    })
    mockEd25519.canSign.mockReturnValue(false)
    mockEd25519.getPrivateKey.mockReturnValue(null)
    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockPrisma) => unknown) => cb(mockPrisma))

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
        { provide: RefreshTokenStore, useValue: mockRefreshTokenStore },
        { provide: Ed25519Service, useValue: mockEd25519 },
        { provide: getQueueToken(QUEUE_SMTP), useValue: mockSmtpQueue },
      ],
    }).compile()
    service = module.get(AuthService)
  })

  describe('register', () => {
    it('should throw if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce({ id: 'existing' })
      await expect(service.register({
        email: 'test@test.com', password: 'Test1234!', fullName: 'Test',
      })).rejects.toThrow(ConflictException)
    })

    it('should create user and return tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null)
      mockUsersService.create.mockResolvedValueOnce({ id: 'new-user', role: 'customer' })
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'new-user', email: 'test@test.com', fullName: 'Test', role: 'customer',
        phone: null, avatarUrl: null, isActive: true, createdAt: new Date(),
      })
      const result = await service.register({
        email: 'test@test.com', password: 'Test1234!', fullName: 'Test',
      })
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.user.id).toBe('new-user')
    })

    it('forces public registration to create customer accounts only', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null)
      mockUsersService.create.mockResolvedValueOnce({ id: 'new-user', role: 'customer' })
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'new-user', email: 'test@test.com', fullName: 'Test', role: 'customer',
        phone: null, avatarUrl: null, isActive: true, createdAt: new Date(),
      })

      await service.register({
        email: 'test@test.com',
        password: 'Test1234!',
        fullName: 'Test',
        role: 'admin',
      } as Parameters<AuthService['register']>[0] & { role: string })

      expect(mockUsersService.create).toHaveBeenCalledWith(expect.objectContaining({
        role: 'customer',
      }))
      expect(mockPrisma.customerProfile.create).toHaveBeenCalledWith({ data: { userId: 'new-user' } })
      expect(mockPrisma.driverProfile.create).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should throw for invalid email', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null)
      await expect(service.login({
        email: 'bad@test.com', password: 'test',
      })).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('requestPasswordReset', () => {
    it('returns the neutral message and does not create a token for unknown emails', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null)

      const result = await service.requestPasswordReset({ email: ' Missing@Example.COM ' })

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('missing@example.com')
      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled()
      expect(mockSmtpQueue.add).not.toHaveBeenCalled()
      expect(result.message).toContain('If an account exists')
    })

    it('stores only a hashed reset token and enqueues the reset email for active users', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'admin@foodflow.vn',
        isActive: true,
      })

      await service.requestPasswordReset({ email: 'admin@foodflow.vn' })

      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', usedAt: null },
      })
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          token: expect.stringMatching(/^[a-f0-9]{64}$/),
          expiresAt: expect.any(Date),
        }),
      })
      const storedHash = mockPrisma.passwordResetToken.create.mock.calls[0][0].data.token
      const queuedBody = mockSmtpQueue.add.mock.calls[0][1].body
      expect(queuedBody).toContain('https://admin.foodflow.test/reset-password?token=')
      expect(queuedBody).not.toContain(storedHash)
    })

    it('does not enqueue a localhost password reset URL in production when the reset base URL is missing', async () => {
      delete mockConfigValues.PASSWORD_RESET_URL_BASE
      mockConfigValues.NODE_ENV = 'production'
      mockUsersService.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'admin@foodflow.vn',
        isActive: true,
      })

      await service.requestPasswordReset({ email: 'admin@foodflow.vn' })

      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled()
      expect(mockSmtpQueue.add).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('rejects invalid or expired reset tokens', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce(null)

      await expect(service.resetPassword({
        token: 'missing-token',
        password: 'NewPass123',
      })).rejects.toThrow(BadRequestException)
    })

    it('updates the password and marks the token as used', async () => {
      const rawToken = 'reset-token'
      const tokenHash = createHash('sha256').update(rawToken).digest('hex')
      mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'reset-1',
        userId: 'user-1',
        token: tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        user: { isActive: true },
      })

      const result = await service.resetPassword({
        token: rawToken,
        password: 'NewPass123',
      })

      expect(mockPrisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: tokenHash },
        include: { user: true },
      })
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          passwordHash: expect.any(String),
          failedLoginCount: 0,
          lockedUntil: null,
        }),
      })
      expect(mockPrisma.user.update.mock.calls[0][0].data.passwordHash).not.toBe('NewPass123')
      expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'reset-1', usedAt: null },
        data: { usedAt: expect.any(Date) },
      })
      expect(mockRefreshTokenStore.revokeAllForUser).toHaveBeenCalledWith('user-1')
      expect(result).toEqual({ message: 'Password reset successful' })
    })
  })
})
