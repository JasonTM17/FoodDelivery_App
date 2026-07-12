import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '@/database/prisma.service'
import { Ed25519Service } from './keys/ed25519.service'

interface JwtPayload {
  sub: string
  role: string
  type?: string
}

/** Decode the JWT header without full verification to read the alg field. */
function extractJwtAlg(rawJwt: string): string {
  try {
    const headerJson = Buffer.from(rawJwt.split('.')[0], 'base64url').toString('utf8')
    return (JSON.parse(headerJson) as { alg?: string }).alg ?? 'HS256'
  } catch {
    return 'HS256'
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ed25519: Ed25519Service,
  ) {
    const jwtSecret = config.get<string>('JWT_SECRET')
    if (!jwtSecret) throw new Error('JWT_SECRET environment variable is not set')
    const legacyFallback = config.get<string>('LEGACY_HS256_FALLBACK') !== 'false'

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secretOrKeyProvider enables per-token algorithm routing; requires passport-jwt ≥4
      // done callback typed as any: crypto.KeyObject is valid at runtime but not in @types/passport-jwt
      secretOrKeyProvider: (
        _req: unknown,
        rawJwt: string,
        done: (err: Error | null, key?: unknown) => void,
      ) => {
        try {
          const alg = extractJwtAlg(rawJwt)
          if (!['HS256', 'EdDSA'].includes(alg)) {
            done(new UnauthorizedException('Token algorithm not allowed'))
            return
          }
          const key = ed25519.resolveKeyForAlg(alg, jwtSecret, legacyFallback)
          done(null, key)
        } catch (err) {
          done(
            new UnauthorizedException(
              err instanceof Error ? err.message : 'Token algorithm rejected',
            ),
          )
        }
      },
      algorithms: ['HS256', 'EdDSA'],
    } as never)
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type')
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    })
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or account is inactive')
    }
    return { ...user, sub: user.id }
  }
}
