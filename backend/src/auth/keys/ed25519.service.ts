import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

export interface JwkPublicKey {
  kty: string
  crv: string
  x: string
  use: string
  alg: string
  kid: string
}

@Injectable()
export class Ed25519Service implements OnModuleInit {
  private readonly logger = new Logger(Ed25519Service.name)
  private publicKey: crypto.KeyObject | null = null
  readonly kid = 'ed25519-primary'

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const pubKeyB64 = this.config.get<string>('JWT_ED25519_PUBLIC_KEY')

    if (!pubKeyB64) {
      this.logger.warn(
        'JWT_ED25519_PUBLIC_KEY not set — EdDSA verify disabled (HS256-only mode)',
      )
      return
    }

    try {
      const pubDer = Buffer.from(pubKeyB64, 'base64')
      this.publicKey = crypto.createPublicKey({ key: pubDer, format: 'der', type: 'spki' })
      this.logger.log('Ed25519 public key loaded — dual-verify active')
    } catch (err) {
      this.logger.error('Failed to load Ed25519 public key; EdDSA verify disabled', err)
    }
  }

  isEnabled(): boolean {
    return this.publicKey !== null
  }

  getPublicKey(): crypto.KeyObject | null {
    return this.publicKey
  }

  getPublicKeyAsJwk(): JwkPublicKey | null {
    if (!this.publicKey) return null
    const raw = this.publicKey.export({ format: 'jwk' }) as Record<string, string>
    return {
      kty: raw['kty'],
      crv: raw['crv'],
      x: raw['x'],
      use: 'sig',
      alg: 'EdDSA',
      kid: this.kid,
    }
  }

  /**
   * Resolves the verification key for a given JWT alg header value.
   * Called by JwtStrategy.secretOrKeyProvider at request time.
   */
  resolveKeyForAlg(
    alg: string,
    hs256Secret: string,
    legacyFallback: boolean,
  ): crypto.KeyObject | string {
    if (alg === 'EdDSA') {
      if (!this.publicKey) {
        throw new Error('EdDSA not configured: JWT_ED25519_PUBLIC_KEY not set')
      }
      return this.publicKey
    }
    if (alg === 'HS256' && legacyFallback) {
      return hs256Secret
    }
    throw new Error(`Algorithm "${alg}" not accepted (LEGACY_HS256_FALLBACK=${legacyFallback})`)
  }
}
