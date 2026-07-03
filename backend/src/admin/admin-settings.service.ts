import { BadRequestException, Injectable } from '@nestjs/common'
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
  },
  branding: {
    primaryColor: '#f97316',
    successColor: '#22c55e',
    logoUrl: null,
    faviconUrl: null,
    themeMode: 'system',
  },
  compliance: {
    kycReviewRequired: true,
    auditRetentionDays: 365,
    exportRetentionHours: 24,
    supportSlaBusinessHours: 'ICT Mon-Sat 08:00-20:00',
  },
  integrations: {
    sepayConfigured: false,
    notificationProviderConfigured: false,
    outboundWebhooksConfigured: false,
    degradedReason: 'Integration settings are not configured in PlatformSetting yet.',
  },
}

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return {
      ...DEFAULT_SETTINGS[section],
      ...jsonObject(row?.value),
      ...patch,
    }
  }

  private toResponse(
    section: AdminSettingsSection,
    row?: { value: Prisma.JsonValue; updatedAt: Date } | null,
  ): AdminSettingsSectionResponse {
    return {
      section,
      settings: redactSensitiveSettings({ ...DEFAULT_SETTINGS[section], ...jsonObject(row?.value) }),
      updatedAt: row?.updatedAt ?? null,
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
