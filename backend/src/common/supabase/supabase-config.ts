import { ConfigService } from '@nestjs/config'

export function getSupabaseStorageAdminKey(config: ConfigService): string {
  // Hosted Storage still validates Authorization as a JWT. Keep the legacy
  // service-role key scoped to Storage until that service accepts opaque keys.
  const value = config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!value) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for Supabase Storage authorization',
    )
  }
  return value
}

export function normalizePem(value: string): string {
  return value.replace(/\\n/g, '\n').trim()
}
