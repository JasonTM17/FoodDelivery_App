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
  private privateKey: crypto.KeyObject | null = null
  readonly kid = 'ed25519-primary'

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const pubKeyB64 = this.config.get<string>('JWT_ED25519_PUBLIC_KEY')
    const privKeyB64 = this.config.get<string>('JWT_ED25519_PRIVATE_KEY')

    if (!pubKeyB64) {
      this.logger.warn(
        'JWT_ED25519_PUBLIC_KEY not set — EdDSA verify disabled (HS256-only mode)',
      )
    } else {
      try {
        const pubDer = Buffer.from(pubKeyB64, 'base64')
        this.publicKey = crypto.createPublicKey({ key: pubDer, format: 'der', type: 'spki' })
        this.logger.log('Ed25519 public key loaded — dual-verify active')
      } catch (err) {
        this.logger.error('Failed to load Ed25519 public key; EdDSA verify disabled', err)
      }
    }

    if (!privKeyB64) {
      this.logger.warn(
        'JWT_ED25519_PRIVATE_KEY not set — access tokens will continue to sign with HS256',
      )
      return
    }

    if (!this.publicKey) {
      this.logger.error(
        'JWT_ED25519_PRIVATE_KEY set without JWT_ED25519_PUBLIC_KEY — refusing EdDSA signing',
      )
      return
    }

    try {
      const privDer = Buffer.from(privKeyB64, 'base64')
      this.privateKey = crypto.createPrivateKey({ key: privDer, format: 'der', type: 'pkcs8' })
      this.logger.log('Ed25519 private key loaded — EdDSA signing active (Phase 2 cutover)')
    } catch (err) {
      this.logger.error('Failed to load Ed25519 private key; HS256 signing remains active', err)
      this.privateKey = null
    }
  }

  isEnabled(): boolean {
    return this.publicKey !== null
  }

  canSign(): boolean {
    return this.privateKey !== null && this.publicKey !== null
  }

  getPublicKey(): crypto.KeyObject | null {
    return this.publicKey
  }

  getPrivateKey(): crypto.KeyObject | null {
    return this.privateKey
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
