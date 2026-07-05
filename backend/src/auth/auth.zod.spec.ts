import { registerSchema } from './auth.zod'

describe('auth validation schemas', () => {
  it('rejects role escalation fields on public registration', () => {
    const result = registerSchema.safeParse({
      email: 'attacker@example.com',
      password: 'Test1234!',
      fullName: 'Role Escalation',
      role: 'admin',
    })

    expect(result.success).toBe(false)
  })
})
