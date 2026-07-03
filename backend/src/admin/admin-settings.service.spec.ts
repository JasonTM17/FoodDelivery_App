import { BadRequestException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { AdminSettingsService } from './admin-settings.service'

describe('AdminSettingsService', () => {
  const platformSetting = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  }
  const service = new AdminSettingsService({ platformSetting } as unknown as PrismaService)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns defaults when a settings section has not been configured', async () => {
    platformSetting.findUnique.mockResolvedValue(null)

    const result = await service.getSection('integrations')

    expect(result.section).toBe('integrations')
    expect(result.settings.sepayConfigured).toBe(false)
    expect(result.settings.outboundWebhooksConfigured).toBe(false)
    expect(result.settings.degradedReason).toContain('not configured')
    expect(result.updatedAt).toBeNull()
  })

  it('returns complete server-owned defaults for editable settings sections', async () => {
    platformSetting.findUnique.mockResolvedValue(null)

    const general = await service.getSection('general')
    const branding = await service.getSection('branding')
    const compliance = await service.getSection('compliance')

    expect(general.settings.notifications).toEqual({
      newOrder: true,
      support: true,
      newDriver: false,
      dailyDigest: true,
    })
    expect(general.settings.security).toEqual({
      maxSessionMinutes: 480,
      maxLoginFailures: 5,
      requireAdminTwoFactor: true,
      loginAuditEnabled: true,
    })
    expect(branding.settings).toEqual(expect.objectContaining({
      platformName: 'FoodFlow',
      supportEmail: '',
      contactPhone: '',
      ogImageUrl: null,
    }))
    expect(compliance.settings).toEqual(expect.objectContaining({
      orderRetentionDays: 365,
      userDataRetentionDays: 730,
      jurisdiction: 'Vietnam',
      vatNumber: null,
      vatEnabled: false,
    }))
  })

  it('merges updates into the stored section and tracks the admin user', async () => {
    platformSetting.findUnique.mockResolvedValue({
      key: 'general',
      value: { platformName: 'Old name', maintenanceMode: false },
      updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    })
    platformSetting.upsert.mockResolvedValue({
      key: 'general',
      value: { platformName: 'FoodFlow Admin', maintenanceMode: true, defaultLocale: 'vi' },
      updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    })

    const result = await service.updateSection('general', { maintenanceMode: true }, 'admin-1')

    expect(platformSetting.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { key: 'general' },
      update: expect.objectContaining({ updatedById: 'admin-1' }),
    }))
    expect(result.settings.maintenanceMode).toBe(true)
    expect(result.updatedAt).toEqual(new Date('2026-07-02T00:00:00.000Z'))
  })

  it('redacts sensitive keys before returning integration settings', async () => {
    platformSetting.findUnique.mockResolvedValue({
      key: 'integrations',
      value: { sepayApiKey: 'secret-value', webhookToken: 'token-value' },
      updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    })

    const result = await service.getSection('integrations')

    expect(result.settings.sepayApiKey).toEqual({ configured: true })
    expect(result.settings.webhookToken).toEqual({ configured: true })
  })

  it('rejects unsupported settings sections', async () => {
    await expect(service.getSection('billing')).rejects.toThrow(BadRequestException)
  })
})
