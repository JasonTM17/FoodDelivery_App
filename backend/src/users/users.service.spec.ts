import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UsersService } from './users.service'
import { PrismaService } from '../database/prisma.service'

describe('UsersService', () => {
  let service: UsersService
  const addressRow = {
    id: 'addr-1',
    label: 'Home',
    addressLine: '2 Le Loi',
    latitude: 10.7769,
    longitude: 106.7009,
    isDefault: true,
    createdAt: new Date('2026-07-06T00:00:00.000Z'),
  }
  const mockPrisma = {
    user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    address: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<unknown>) => callback(mockPrisma))

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

  describe('listAddresses', () => {
    it('returns current user addresses with real PostGIS coordinates', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([addressRow])

      const result = await service.listAddresses('user-1')

      expect(result).toEqual([
        expect.objectContaining({
          id: 'addr-1',
          addressLine: '2 Le Loi',
          latitude: 10.7769,
          longitude: 106.7009,
          isDefault: true,
        }),
      ])
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1)
    })
  })

  describe('createAddress', () => {
    it('locks one user before replacing their default address', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: 'user-1' }])
        .mockResolvedValueOnce([addressRow])

      await service.createAddress('user-1', {
        label: 'Home',
        addressLine: '2 Le Loi',
        latitude: 10.7769,
        longitude: 106.7009,
        isDefault: true,
      })

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2)
      expect(mockPrisma.$queryRaw.mock.calls[0][0].strings.join('')).toContain(
        'FOR UPDATE',
      )
      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { isDefault: false },
      })
    })

    it('creates a PostGIS address and clears other defaults when requested', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: 'user-1' }])
        .mockResolvedValueOnce([addressRow])

      const result = await service.createAddress('user-1', {
        label: 'Home',
        addressLine: '2 Le Loi',
        latitude: 10.7769,
        longitude: 106.7009,
        isDefault: true,
      })

      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { isDefault: false },
      })
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2)
      expect(mockPrisma.$queryRaw.mock.calls[1][0].strings.join('')).toContain(
        'gen_random_uuid()',
      )
      expect(result).toMatchObject({
        id: 'addr-1',
        latitude: 10.7769,
        longitude: 106.7009,
      })
    })

    it('rejects missing or out-of-bounds coordinates', async () => {
      await expect(service.createAddress('user-1', {
        label: 'Home',
        addressLine: '2 Le Loi',
      })).rejects.toThrow(BadRequestException)

      await expect(service.createAddress('user-1', {
        label: 'Home',
        addressLine: '2 Le Loi',
        latitude: 0,
        longitude: 0,
      })).rejects.toThrow(BadRequestException)

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('updateAddress', () => {
    it('updates an owned address and returns the canonical row', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...addressRow, label: 'Office', isDefault: false },
      ])

      const result = await service.updateAddress('user-1', 'addr-1', {
        label: 'Office',
        isDefault: false,
      })

      expect(result).toMatchObject({ id: 'addr-1', label: 'Office', isDefault: false })
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1)
    })

    it('throws when the address is not owned by the current user', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([])

      await expect(service.updateAddress('user-1', 'missing', {
        label: 'Office',
      })).rejects.toThrow(NotFoundException)
    })
  })

  describe('deleteAddress', () => {
    it('deletes only current user addresses', async () => {
      mockPrisma.address.deleteMany.mockResolvedValueOnce({ count: 1 })

      await expect(service.deleteAddress('user-1', 'addr-1')).resolves.toEqual({ success: true })
      expect(mockPrisma.address.deleteMany).toHaveBeenCalledWith({
        where: { id: 'addr-1', userId: 'user-1' },
      })
    })

    it('throws when no owned address is deleted', async () => {
      mockPrisma.address.deleteMany.mockResolvedValueOnce({ count: 0 })

      await expect(service.deleteAddress('user-1', 'addr-1')).rejects.toThrow(NotFoundException)
    })
  })
})
