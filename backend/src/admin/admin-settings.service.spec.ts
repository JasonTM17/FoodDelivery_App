import { BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../database/prisma.service'
import { AdminSettingsService } from './admin-settings.service'

describe('AdminSettingsService', () => {
  const platformSetting = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  }
  const config = {
    get: jest.fn(),
  }
  const service = new AdminSettingsService(
    { platformSetting } as unknown as PrismaService,
    config as unknown as ConfigService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    config.get.mockReturnValue(undefined)
  })

  it('returns runtime-derived integration flags without degraded placeholders', async () => {
    platformSetting.findUnique.mockResolvedValue(null)

    const result = await service.getSection('integrations')

    expect(result.section).toBe('integrations')
    expect(result.settings.sepayConfigured).toBe(false)
    expect(result.settings.outboundWebhooksConfigured).toBe(false)
    expect(result.settings).not.toHaveProperty('degradedReason')
    expect(result.updatedAt).toBeNull()
  })

  it('marks integrations configured only when real secret-manager env values are present', async () => {
    platformSetting.findUnique.mockResolvedValue({
      key: 'integrations',
      value: {
        sepayConfigured: false,
        notificationProviderConfigured: false,
        outboundWebhooksConfigured: false,
      },
      updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    })
    config.get.mockImplementation((key: string) => ({
      SEPAY_ACCOUNT_NUMBER: '1234567890',
      SEPAY_BANK_NAME: 'Vietcombank',
      SEPAY_WEBHOOK_SECRET: 'live-sepay-webhook-secret',
      FCM_PROJECT_ID: 'foodflow-production',
      WEBHOOK_SECRET: 'live-webhook-secret',
    })[key])

    const result = await service.getSection('integrations')

    expect(result.settings).toEqual(expect.objectContaining({
      sepayConfigured: true,
      notificationProviderConfigured: true,
      outboundWebhooksConfigured: true,
    }))
  })

  it('does not treat documented placeholder env values as configured', async () => {
    platformSetting.findUnique.mockResolvedValue(null)
    config.get.mockImplementation((key: string) => ({
      SEPAY_ACCOUNT_NUMBER: 'your-sepay-account-number',
      SEPAY_BANK_NAME: 'your-sepay-bank-name',
      SEPAY_WEBHOOK_SECRET: 'your-sepay-webhook-secret',
      FCM_PROJECT_ID: 'your-firebase-project-id',
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'your-smtp-user',
      SMTP_PASS: 'your-smtp-password',
      SMTP_FROM: 'noreply@foodflow.vn',
      TWILIO_ACCOUNT_SID: 'your-twilio-account-sid',
      TWILIO_AUTH_TOKEN: 'your-twilio-auth-token',
      TWILIO_FROM_NUMBER: 'your-twilio-from-number',
      WEBHOOK_SECRET: 'your-webhook-secret',
    })[key])

    const result = await service.getSection('integrations')

    expect(result.settings).toEqual(expect.objectContaining({
      sepayConfigured: false,
      notificationProviderConfigured: false,
      outboundWebhooksConfigured: false,
    }))
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
