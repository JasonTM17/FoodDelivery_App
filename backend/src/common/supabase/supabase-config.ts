import { ConfigService } from '@nestjs/config'

export function getSupabaseSecretKey(config: ConfigService): string {
  const value =
    config.get<string>('SUPABASE_SECRET_KEY')?.trim() ||
    config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!value) throw new Error('SUPABASE_SECRET_KEY is required')
  return value
}

export function normalizePem(value: string): string {
  return value.replace(/\\n/g, '\n').trim()
}
