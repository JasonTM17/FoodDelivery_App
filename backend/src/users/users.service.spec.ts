import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { PrismaService } from '../database/prisma.service'
import { NotFoundException } from '@nestjs/common'

describe('UsersService', () => {
  let service: UsersService
  const mockPrisma = {
    user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get(UsersService)
  })

  describe('getProfile', () => {
    it('throws NotFound when user missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)
      await expect(service.getProfile('bad-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com' })
      const result = await service.findByEmail('a@b.com')
      expect(result?.email).toBe('a@b.com')
    })
  })
})
