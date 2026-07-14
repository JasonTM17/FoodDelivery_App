import { ConfigService } from '@nestjs/config'
import { getSupabaseStorageAdminKey } from './supabase-config'

describe('getSupabaseStorageAdminKey', () => {
  it('prefers the legacy service-role JWT for Storage authorization', () => {
    const config = new ConfigService({
      SUPABASE_SECRET_KEY: 'sb_secret_platform_key',
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-service-role-jwt',
    })

    expect(getSupabaseStorageAdminKey(config)).toBe('legacy-service-role-jwt')
  })

  it('rejects an opaque secret because Storage still requires a JWT', () => {
    const config = new ConfigService({
      SUPABASE_SECRET_KEY: 'sb_secret_platform_key',
    })

    expect(() => getSupabaseStorageAdminKey(config)).toThrow(
      'SUPABASE_SERVICE_ROLE_KEY is required for Supabase Storage authorization',
    )
  })
})
