import { BadRequestException, NotFoundException } from '@nestjs/common'
import { DriverBankAccountsService } from './driver-bank-accounts.service'
import { PrismaService } from '../database/prisma.service'

const now = new Date('2026-07-03T10:00:00Z')

describe('DriverBankAccountsService', () => {
  const driverBankAccount = {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  const prisma = {
    driverProfile: { findUnique: jest.fn() },
    driverBankAccount,
    $transaction: jest.fn(async (callback: (tx: typeof prisma) => unknown) => callback(prisma)),
  } as unknown as PrismaService & {
    driverProfile: { findUnique: jest.Mock }
    driverBankAccount: typeof driverBankAccount
    $transaction: jest.Mock
  }
  let service: DriverBankAccountsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new DriverBankAccountsService(prisma)
  })

  it('lists accounts owned by the authenticated driver only', async () => {
    driverBankAccount.findMany.mockResolvedValueOnce([
      accountRow({ id: 'account-1', driverId: 'driver-1', isDefault: true }),
    ])

    await expect(service.list('driver-1')).resolves.toEqual([
      {
        id: 'account-1',
        bankCode: 'vcb',
        bankName: 'Vietcombank',
        accountNumber: '001100223344',
        accountHolderName: 'NGUYEN VAN A',
        isDefault: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ])
    expect(driverBankAccount.findMany).toHaveBeenCalledWith({
      where: { driverId: 'driver-1' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('creates the first bank account as default after verifying driver profile', async () => {
    prisma.driverProfile.findUnique.mockResolvedValueOnce({ userId: 'driver-1' })
    driverBankAccount.count.mockResolvedValueOnce(0)
    driverBankAccount.create.mockResolvedValueOnce(accountRow({ id: 'account-1', driverId: 'driver-1', isDefault: true }))

    const result = await service.create('driver-1', {
      bankCode: ' VCB ',
      bankName: ' Vietcombank ',
      accountNumber: '001100223344',
      accountHolderName: ' NGUYEN VAN A ',
    })

    expect(result.isDefault).toBe(true)
    expect(driverBankAccount.create).toHaveBeenCalledWith({
      data: {
        driverId: 'driver-1',
        bankCode: 'vcb',
        bankName: 'Vietcombank',
        accountNumber: '001100223344',
        accountHolderName: 'NGUYEN VAN A',
        isDefault: true,
      },
    })
  })

  it('rejects account creation when the user has no driver profile', async () => {
    prisma.driverProfile.findUnique.mockResolvedValueOnce(null)

    await expect(service.create('user-1', {
      bankCode: 'vcb',
      bankName: 'Vietcombank',
      accountNumber: '001100223344',
      accountHolderName: 'NGUYEN VAN A',
    })).rejects.toThrow(NotFoundException)
    expect(driverBankAccount.create).not.toHaveBeenCalled()
  })

  it('maps duplicate bank accounts to a client-safe bad request', async () => {
    prisma.driverProfile.findUnique.mockResolvedValueOnce({ userId: 'driver-1' })
    driverBankAccount.count.mockResolvedValueOnce(1)
    driverBankAccount.create.mockRejectedValueOnce({ code: 'P2002' })

    await expect(service.create('driver-1', {
      bankCode: 'vcb',
      bankName: 'Vietcombank',
      accountNumber: '001100223344',
      accountHolderName: 'NGUYEN VAN A',
    })).rejects.toThrow(BadRequestException)
  })

  it('sets a default account only after proving ownership', async () => {
    driverBankAccount.findFirst.mockResolvedValueOnce(accountRow({ id: 'account-2', driverId: 'driver-1', isDefault: false }))
    driverBankAccount.update.mockResolvedValueOnce(accountRow({ id: 'account-2', driverId: 'driver-1', isDefault: true }))

    const result = await service.setDefault('driver-1', 'account-2')

    expect(result.isDefault).toBe(true)
    expect(driverBankAccount.findFirst).toHaveBeenCalledWith({ where: { id: 'account-2', driverId: 'driver-1' } })
    expect(driverBankAccount.updateMany).toHaveBeenCalledWith({
      where: { driverId: 'driver-1', isDefault: true },
      data: { isDefault: false },
    })
  })

  it('deletes only an owned account and promotes the next account when needed', async () => {
    driverBankAccount.findFirst
      .mockResolvedValueOnce(accountRow({ id: 'account-1', driverId: 'driver-1', isDefault: true }))
      .mockResolvedValueOnce(accountRow({ id: 'account-2', driverId: 'driver-1', isDefault: false }))

    await expect(service.delete('driver-1', 'account-1')).resolves.toEqual({ deleted: true })

    expect(driverBankAccount.delete).toHaveBeenCalledWith({ where: { id: 'account-1' } })
    expect(driverBankAccount.update).toHaveBeenCalledWith({
      where: { id: 'account-2' },
      data: { isDefault: true },
    })
  })
})

function accountRow(overrides: {
  id: string
  driverId: string
  isDefault: boolean
}) {
  return {
    bankCode: 'vcb',
    bankName: 'Vietcombank',
    accountNumber: '001100223344',
    accountHolderName: 'NGUYEN VAN A',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
