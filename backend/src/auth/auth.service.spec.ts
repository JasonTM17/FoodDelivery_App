import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { PrismaService } from '../database/prisma.service'
import { RefreshTokenStore } from './refresh-token.store'

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
    user: { findUnique: jest.fn() },
  }

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  }

  const mockConfig = {
    get: jest.fn().mockReturnValue('test-secret'),
  }

  const mockRefreshTokenStore = {
    blocklist: jest.fn(),
    isBlocklisted: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
        { provide: RefreshTokenStore, useValue: mockRefreshTokenStore },
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
  })

  describe('login', () => {
    it('should throw for invalid email', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null)
      await expect(service.login({
        email: 'bad@test.com', password: 'test',
      })).rejects.toThrow(UnauthorizedException)
    })
  })
})
