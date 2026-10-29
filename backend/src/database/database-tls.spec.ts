import { readFileSync } from 'node:fs'
import { withVerifiedDatabaseTls } from './database-tls'

describe('verified database TLS', () => {
  const url = 'postgresql://local:test@localhost:5432/db?connection_limit=1'
  it('leaves unconfigured local databases unchanged', () => {
    expect(withVerifiedDatabaseTls(url, undefined)).toBe(url)
    expect(withVerifiedDatabaseTls(undefined, undefined)).toBeUndefined()
  })
  it('requires strict verification and preserves the pool bound when a CA is supplied', () => {
    const pem = '-----BEGIN CERTIFICATE-----\npublic-test-fixture\n-----END CERTIFICATE-----'
    const parsed = new URL(withVerifiedDatabaseTls(url, pem)!)
    expect(parsed.searchParams.get('sslaccept')).toBe('strict')
    expect(parsed.searchParams.get('sslmode')).toBe('require')
    expect(parsed.searchParams.get('connection_limit')).toBe('1')
    expect(readFileSync(parsed.searchParams.get('sslcert')!, 'utf8')).toBe(pem + '\n')
    expect(withVerifiedDatabaseTls(url, pem)).toBe(parsed.toString())
  })
  it('refuses invalid certificate configuration', () => {
    expect(() => withVerifiedDatabaseTls(url, 'invalid')).toThrow('PEM certificate')
  })
})
