import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Prisma's native engine accepts a CA file. The certificate is public;
 * its hashed path is shared safely across requests in a warm instance. */
export function withVerifiedDatabaseTls(url: string | undefined, ca: string | undefined): string | undefined {
  if (!url || !ca?.trim()) return url
  const pem = ca.replace(/\\n/g, '\n').trim() + '\n'
  if (!pem.includes('-----BEGIN CERTIFICATE-----')) throw new Error('DB_SSL_CA must contain a PEM certificate')
  const file = join(tmpdir(), `foodflow-db-ca-${createHash('sha256').update(pem).digest('hex')}.pem`)
  try {
    writeFileSync(file, pem, { flag: 'wx', mode: 0o600 })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || readFileSync(file, 'utf8') !== pem) throw error
  }
  const parsed = new URL(url)
  parsed.searchParams.set('sslmode', 'require')
  parsed.searchParams.set('sslaccept', 'strict')
  parsed.searchParams.set('sslcert', file)
  return parsed.toString()
}
