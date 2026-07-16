import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('production role smoke semantic identity migration', () => {
  const migration = readFileSync(join(
    __dirname,
    '../../prisma/migrations/20260715183000_enforce_semantic_identity_references/migration.sql',
  ), 'utf8')

  it('wraps the complete DDL rollout in one explicit transaction', () => {
    const sql = migration.trim()

    expect(sql.startsWith('BEGIN;')).toBe(true)
    expect(sql.endsWith('COMMIT;')).toBe(true)
    expect(sql.indexOf('COMMIT;')).toBe(sql.lastIndexOf('COMMIT;'))
  })

  it.each([
    'restaurants.approved_by_id',
    'carts.restaurant_id',
    'promotions.created_by_id',
    'chat_messages.sender_id',
    'support_macros.created_by_id',
    'support_csat_responses.user_id',
  ])('preflights orphan rows for %s before installing constraints', semanticReference => {
    expect(migration).toContain(`${semanticReference} has % orphan row(s)`)
    expect(migration.indexOf(`${semanticReference} has % orphan row(s)`))
      .toBeLessThan(migration.indexOf('ALTER TABLE "restaurants"'))
  })
})
