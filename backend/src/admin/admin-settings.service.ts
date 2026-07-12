import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import {
  AdminSettingsPatchDto,
  AdminSettingsSection,
  AdminSettingsSectionResponse,
  AdminSettingsValue,
} from './admin-settings.dto'

const SETTINGS_SECTIONS: AdminSettingsSection[] = ['general', 'branding', 'compliance', 'integrations']

const DEFAULT_SETTINGS: Record<AdminSettingsSection, AdminSettingsValue> = {
  general: {
    platformName: 'FoodFlow',
    defaultLocale: 'vi',
    timezone: 'Asia/Bangkok',
    currency: 'VND',
    maintenanceMode: false,
    registrationEnabled: true,
    notifications: {
      newOrder: true,
      support: true,
      newDriver: false,
      dailyDigest: true,
    },
    security: {
      maxSessionMinutes: 480,
      maxLoginFailures: 5,
      requireAdminTwoFactor: true,
      loginAuditEnabled: true,
    },
    dataRetention: {
      autoDeleteLogs: true,
      deleteOldOrders: false,
    },
  },
  branding: {
    platformName: 'FoodFlow',
    tagline: 'Fast food delivery, done well',
    supportEmail: '',
    contactPhone: '',
    primaryColor: '#f97316',
    successColor: '#22c55e',
    logoUrl: null,
    faviconUrl: null,
    ogImageUrl: null,
    themeMode: 'system',
  },
  compliance: {
    tosUrl: null,
    privacyUrl: null,
    cookiePolicyUrl: null,
    kycReviewRequired: true,
    auditRetentionDays: 365,
    orderRetentionDays: 365,
    userDataRetentionDays: 730,
    consentBannerEnabled: true,
    dataExportRequestsEnabled: true,
    deletionRequestsEnabled: true,
    jurisdiction: 'Vietnam',
    vatNumber: null,
    vatEnabled: false,
    exportRetentionHours: 24,
    supportSlaBusinessHours: 'ICT Mon-Sat 08:00-20:00',
  },
  integrations: {
    sepayConfigured: false,
    notificationProviderConfigured: false,
    outboundWebhooksConfigured: false,
  },
}

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getAll() {
    const rows = await this.prisma.platformSetting.findMany({
      where: { key: { in: SETTINGS_SECTIONS } },
    })
    const byKey = new Map(rows.map(row => [row.key, row]))
    const sections = Object.fromEntries(
      SETTINGS_SECTIONS.map(section => [section, this.toResponse(section, byKey.get(section))]),
    )

    return { sections }
  }

  async getSection(section: string): Promise<AdminSettingsSectionResponse> {
    const key = normalizeSection(section)
    const row = await this.prisma.platformSetting.findUnique({ where: { key } })
    return this.toResponse(key, row)
  }

  async updateSection(
    section: string,
    patch: AdminSettingsValue,
    adminId: string,
  ): Promise<AdminSettingsSectionResponse> {
    const key = normalizeSection(section)
    const merged = await this.mergeSettings(key, patch)
    const row = await this.prisma.platformSetting.upsert({
      where: { key },
      create: { key, value: merged as Prisma.InputJsonValue, updatedById: adminId },
      update: { value: merged as Prisma.InputJsonValue, updatedById: adminId },
    })

    return this.toResponse(key, row)
  }

  async updateMany(patch: AdminSettingsPatchDto, adminId: string) {
    const sections = Object.entries(pickSectionPatches(patch))
    if (sections.length === 0) {
      return { sections: { general: await this.updateSection('general', patch, adminId) } }
    }

    const updates = await Promise.all(
      sections.map(async ([section, value]) => [
        section,
        await this.updateSection(section, value as AdminSettingsValue, adminId),
      ]),
    )

    return { sections: Object.fromEntries(updates) }
  }

  private async mergeSettings(
    section: AdminSettingsSection,
    patch: AdminSettingsValue,
  ): Promise<AdminSettingsValue> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: section } })
    const base = {
      ...DEFAULT_SETTINGS[section],
      ...jsonObject(row?.value),
    }
    return deepMergeSettings(base, patch)
  }

  private toResponse(
    section: AdminSettingsSection,
    row?: { value: Prisma.JsonValue; updatedAt: Date } | null,
  ): AdminSettingsSectionResponse {
    const stored = jsonObject(row?.value)
    const runtime = section === 'integrations' ? this.integrationRuntimeSettings() : {}
    return {
      section,
      settings: redactSensitiveSettings({ ...DEFAULT_SETTINGS[section], ...stored, ...runtime }),
      updatedAt: row?.updatedAt ?? null,
    }
  }

  private integrationRuntimeSettings(): AdminSettingsValue {
    const sepayConfigured = allConfigured(
      this.config.get<string>('SEPAY_ACCOUNT_NUMBER'),
      this.config.get<string>('SEPAY_BANK_NAME'),
      this.config.get<string>('SEPAY_WEBHOOK_SECRET'),
    )
    const notificationProviderConfigured = anyConfigured(
      this.config.get<string>('FCM_SERVER_KEY'),
      allConfigured(
        this.config.get<string>('SMTP_HOST'),
        this.config.get<string>('SMTP_USER'),
        this.config.get<string>('SMTP_PASS'),
        this.config.get<string>('SMTP_FROM'),
      ),
      allConfigured(
        this.config.get<string>('TWILIO_ACCOUNT_SID'),
        this.config.get<string>('TWILIO_AUTH_TOKEN'),
        this.config.get<string>('TWILIO_FROM_NUMBER'),
      ),
    )
    const outboundWebhooksConfigured = isConfigured(this.config.get<string>('WEBHOOK_SECRET'))

    return {
      sepayConfigured,
      notificationProviderConfigured,
      outboundWebhooksConfigured,
    }
  }
}

function normalizeSection(section: string): AdminSettingsSection {
  if (!SETTINGS_SECTIONS.includes(section as AdminSettingsSection)) {
    throw new BadRequestException('ADMIN_SETTINGS_SECTION_UNSUPPORTED')
  }
  return section as AdminSettingsSection
}

function pickSectionPatches(patch: AdminSettingsPatchDto): Partial<Record<AdminSettingsSection, AdminSettingsValue>> {
  return Object.fromEntries(
    SETTINGS_SECTIONS
      .filter(section => isPlainObject(patch[section]))
      .map(section => [section, patch[section] as AdminSettingsValue]),
  )
}

function jsonObject(value: Prisma.JsonValue | null | undefined): AdminSettingsValue {
  return isPlainObject(value) ? value as AdminSettingsValue : {}
}

/** Deep-merge plain objects so nested patches do not wipe sibling keys. */
function deepMergeSettings(
  base: AdminSettingsValue,
  patch: AdminSettingsValue,
): AdminSettingsValue {
  const out: AdminSettingsValue = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    const prev = out[key]
    if (isPlainObject(prev) && isPlainObject(value)) {
      out[key] = deepMergeSettings(prev as AdminSettingsValue, value as AdminSettingsValue)
    } else {
      out[key] = value
    }
  }
  return out
}

function redactSensitiveSettings(settings: AdminSettingsValue): AdminSettingsValue {
  return Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [
      key,
      /secret|token|password|apiKey|privateKey/i.test(key) ? { configured: Boolean(value) } : value,
    ]),
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function allConfigured(...values: unknown[]): boolean {
  return values.every(isConfigured)
}

function anyConfigured(...values: unknown[]): boolean {
  return values.some(isConfigured)
}

function isConfigured(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return false
  const normalized = value.trim()
  if (!normalized) return false
  return ![
    /^(your[-_\s]|replace[-_\s]?with|replace[-_\s]?me|placeholder|example)/i,
    /example\.com$/i,
    /change[-_\s]?me/i,
  ].some((pattern) => pattern.test(normalized))
}
