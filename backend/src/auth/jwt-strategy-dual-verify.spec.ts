import * as crypto from 'crypto'
import * as jwtLib from 'jsonwebtoken'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import { Ed25519Service } from './keys/ed25519.service'
import { JwtStrategy } from './jwt.strategy'
import { PrismaService } from '@/database/prisma.service'

const TEST_SECRET = 'test-hs256-secret-value-must-be-32-chars!'

// Single Ed25519 key pair shared across all tests (generation is expensive)
const { privateKey: edPrivKey, publicKey: edPubKey } = crypto.generateKeyPairSync('ed25519')
const edPubB64 = (edPubKey.export({ type: 'spki', format: 'der' }) as Buffer).toString('base64')

async function buildModule(overrides: Record<string, string> = {}): Promise<TestingModule> {
  const cfg: Record<string, string> = {
    JWT_SECRET: TEST_SECRET,
    JWT_ED25519_PUBLIC_KEY: edPubB64,
    LEGACY_HS256_FALLBACK: 'true',
    ...overrides,
  }
  const m = await Test.createTestingModule({
    providers: [
      Ed25519Service,
      JwtStrategy,
      { provide: PrismaService, useValue: { user: { findUnique: jest.fn() } } },
      { provide: ConfigService, useValue: { get: (k: string) => cfg[k] } },
    ],
  }).compile()
  await m.init()
  return m
}

// ---------------------------------------------------------------------------
// Ed25519Service unit tests
// ---------------------------------------------------------------------------
describe('Ed25519Service', () => {
  let svc: Ed25519Service

  beforeEach(async () => {
    svc = (await buildModule()).get(Ed25519Service)
  })

  it('isEnabled() true when public key configured', () => {
    expect(svc.isEnabled()).toBe(true)
  })

  it('getPublicKeyAsJwk() returns well-formed OKP JWK', () => {
    const jwk = svc.getPublicKeyAsJwk()
    expect(jwk).not.toBeNull()
    expect(jwk!.kty).toBe('OKP')
    expect(jwk!.crv).toBe('Ed25519')
    expect(jwk!.alg).toBe('EdDSA')
    expect(jwk!.use).toBe('sig')
    expect(jwk!.kid).toBe('ed25519-primary')
    expect(typeof jwk!.x).toBe('string')
  })

  it('isEnabled() false when key not configured', async () => {
    const m = await buildModule({ JWT_ED25519_PUBLIC_KEY: '' })
    const s = m.get(Ed25519Service)
    expect(s.isEnabled()).toBe(false)
    expect(s.getPublicKeyAsJwk()).toBeNull()
  })

  it('resolveKeyForAlg: HS256 + fallback=true → returns secret string', () => {
    expect(svc.resolveKeyForAlg('HS256', TEST_SECRET, true)).toBe(TEST_SECRET)
  })

  it('resolveKeyForAlg: EdDSA → returns KeyObject', () => {
    const key = svc.resolveKeyForAlg('EdDSA', TEST_SECRET, true)
    expect((key as crypto.KeyObject).asymmetricKeyType).toBe('ed25519')
  })

  it('resolveKeyForAlg: EdDSA when not configured → throws', async () => {
    const m = await buildModule({ JWT_ED25519_PUBLIC_KEY: '' })
    const s = m.get(Ed25519Service)
    expect(() => s.resolveKeyForAlg('EdDSA', TEST_SECRET, true)).toThrow('EdDSA not configured')
  })

  it('resolveKeyForAlg: HS256 + fallback=false → throws', () => {
    expect(() => svc.resolveKeyForAlg('HS256', TEST_SECRET, false)).toThrow()
  })

  it('resolveKeyForAlg: unsupported alg → throws', () => {
    expect(() => svc.resolveKeyForAlg('RS256', TEST_SECRET, true)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// JwtStrategy.validate unit tests
// ---------------------------------------------------------------------------
describe('JwtStrategy.validate', () => {
  let strategy: JwtStrategy
  let findUnique: jest.Mock

  const baseUser = {
    id: 'u1',
    email: 'a@b.com',
    fullName: 'A B',
    role: 'CUSTOMER',
    phone: null,
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
  }

  beforeEach(async () => {
    findUnique = jest.fn()
    const m = await Test.createTestingModule({
      providers: [
        Ed25519Service,
        JwtStrategy,
        { provide: PrismaService, useValue: { user: { findUnique } } },
        {
          provide: ConfigService,
          useValue: {
            get: (k: string) =>
              ({ JWT_SECRET: TEST_SECRET, JWT_ED25519_PUBLIC_KEY: edPubB64, LEGACY_HS256_FALLBACK: 'true' })[k],
          },
        },
      ],
    }).compile()
    await m.init()
    strategy = m.get(JwtStrategy)
  })

  it('returns user for valid active payload', async () => {
    findUnique.mockResolvedValue(baseUser)
    const result = await strategy.validate({ sub: 'u1', role: 'CUSTOMER' })
    expect(result.id).toBe('u1')
    expect(result.sub).toBe('u1')
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, select: expect.any(Object) })
  })

  it('throws UnauthorizedException when user not found', async () => {
    findUnique.mockResolvedValue(null)
    await expect(strategy.validate({ sub: 'ghost', role: 'CUSTOMER' })).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('throws UnauthorizedException when user is inactive', async () => {
    findUnique.mockResolvedValue({ ...baseUser, isActive: false })
    await expect(strategy.validate({ sub: 'u1', role: 'CUSTOMER' })).rejects.toThrow(
      UnauthorizedException,
    )
  })
})

// ---------------------------------------------------------------------------
// Token verification round-trip tests
// ---------------------------------------------------------------------------
describe('JWT dual-alg verification round-trip', () => {
  let svc: Ed25519Service

  beforeEach(async () => {
    svc = (await buildModule()).get(Ed25519Service)
  })

  it('HS256 token verifies correctly', () => {
    const token = jwtLib.sign({ sub: 'u1' }, TEST_SECRET, { algorithm: 'HS256' })
    const key = svc.resolveKeyForAlg('HS256', TEST_SECRET, true) as string
    const decoded = jwtLib.verify(token, key, { algorithms: ['HS256'] }) as Record<string, unknown>
    expect(decoded['sub']).toBe('u1')
  })

  it('Ed25519 public key verifies a correctly-signed payload', () => {
    // jsonwebtoken@9 does not support EdDSA signing; test the crypto primitive directly
    const headerB64 = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url')
    const payloadB64 = Buffer.from(JSON.stringify({ sub: 'u1' })).toString('base64url')
    const sigInput = `${headerB64}.${payloadB64}`
    const signature = crypto.sign(null, Buffer.from(sigInput), edPrivKey)
    const pubKey = svc.resolveKeyForAlg('EdDSA', TEST_SECRET, true) as crypto.KeyObject
    expect(crypto.verify(null, Buffer.from(sigInput), pubKey, signature)).toBe(true)
  })

  it('rejects EdDSA payload signed with wrong key', () => {
    const { privateKey: wrongKey } = crypto.generateKeyPairSync('ed25519')
    const headerB64 = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url')
    const payloadB64 = Buffer.from(JSON.stringify({ sub: 'u1' })).toString('base64url')
    const sigInput = `${headerB64}.${payloadB64}`
    const signature = crypto.sign(null, Buffer.from(sigInput), wrongKey)
    const pubKey = svc.resolveKeyForAlg('EdDSA', TEST_SECRET, true) as crypto.KeyObject
    expect(crypto.verify(null, Buffer.from(sigInput), pubKey, signature)).toBe(false)
  })

  it('rejects expired HS256 token', () => {
    const payload = { sub: 'u1', exp: Math.floor(Date.now() / 1000) - 60 }
    const token = jwtLib.sign(payload, TEST_SECRET, { algorithm: 'HS256' })
    const key = svc.resolveKeyForAlg('HS256', TEST_SECRET, true) as string
    expect(() => jwtLib.verify(token, key, { algorithms: ['HS256'] })).toThrow(/expired/)
  })
})
