import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DriverBankAccount } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { DriverBankAccountInput } from './driver-bank-accounts.zod'

export interface DriverBankAccountView {
  id: string
  bankCode: string
  bankName: string
  accountNumber: string
  accountHolderName: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

@Injectable()
export class DriverBankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(driverId: string): Promise<DriverBankAccountView[]> {
    const accounts = await this.prisma.driverBankAccount.findMany({
      where: { driverId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return accounts.map(toView)
  }

  async create(driverId: string, input: DriverBankAccountInput): Promise<DriverBankAccountView> {
    await this.ensureDriverProfile(driverId)
    const normalized = normalizeInput(input)

    const account = await this.prisma.$transaction(async tx => {
      const existingCount = await tx.driverBankAccount.count({ where: { driverId } })
      try {
        return await tx.driverBankAccount.create({
          data: {
            driverId,
            ...normalized,
            isDefault: existingCount === 0,
          },
        })
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new BadRequestException({
            code: 'DRIVER_BANK_ACCOUNT_DUPLICATE',
            message: 'Driver bank account already exists',
          })
        }
        throw error
      }
    })

    return toView(account)
  }

  async delete(driverId: string, accountId: string): Promise<{ deleted: true }> {
    const account = await this.findOwnedAccount(driverId, accountId)

    await this.prisma.$transaction(async tx => {
      await tx.driverBankAccount.delete({ where: { id: account.id } })
      if (!account.isDefault) return

      const nextDefault = await tx.driverBankAccount.findFirst({
        where: { driverId },
        orderBy: { createdAt: 'desc' },
      })
      if (nextDefault) {
        await tx.driverBankAccount.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        })
      }
    })

    return { deleted: true }
  }

  async setDefault(driverId: string, accountId: string): Promise<DriverBankAccountView> {
    await this.findOwnedAccount(driverId, accountId)

    const account = await this.prisma.$transaction(async tx => {
      await tx.driverBankAccount.updateMany({
        where: { driverId, isDefault: true },
        data: { isDefault: false },
      })
      return tx.driverBankAccount.update({
        where: { id: accountId },
        data: { isDefault: true },
      })
    })

    return toView(account)
  }

  private async ensureDriverProfile(driverId: string): Promise<void> {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId: driverId },
      select: { userId: true },
    })
    if (!profile) throw new NotFoundException('DRIVER_PROFILE_NOT_FOUND')
  }

  private async findOwnedAccount(driverId: string, accountId: string): Promise<DriverBankAccount> {
    const account = await this.prisma.driverBankAccount.findFirst({
      where: { id: accountId, driverId },
    })
    if (!account) throw new NotFoundException('DRIVER_BANK_ACCOUNT_NOT_FOUND')
    return account
  }
}

function normalizeInput(input: DriverBankAccountInput): DriverBankAccountInput {
  return {
    bankCode: input.bankCode.trim().toLowerCase(),
    bankName: input.bankName.trim(),
    accountNumber: input.accountNumber.trim(),
    accountHolderName: input.accountHolderName.trim(),
  }
}

function toView(account: DriverBankAccount): DriverBankAccountView {
  return {
    id: account.id,
    bankCode: account.bankCode,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountHolderName: account.accountHolderName,
    isDefault: account.isDefault,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002',
  )
}
