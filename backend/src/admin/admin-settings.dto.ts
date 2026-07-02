export type AdminSettingsSection = 'general' | 'branding' | 'compliance' | 'integrations'

export type AdminSettingsValue = Record<string, unknown>

export type AdminSettingsPatchDto = Partial<Record<AdminSettingsSection, AdminSettingsValue>> & AdminSettingsValue

export interface AdminSettingsSectionResponse {
  section: AdminSettingsSection
  settings: AdminSettingsValue
  updatedAt: Date | null
}
