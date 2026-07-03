import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole } from '@prisma/client'
import { Algorithm, decode, JwtPayload, verify } from 'jsonwebtoken'
import type { Socket } from 'socket.io'
import { PrismaService } from '../database/prisma.service'
import { Ed25519Service } from './keys/ed25519.service'

export interface AuthenticatedSocketUser {
  sub: string
  role: UserRole
}

interface AccessTokenPayload extends JwtPayload {
  sub?: string
  role?: string
  type?: string
}

@Injectable()
export class WebSocketAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly ed25519: Ed25519Service,
    private readonly prisma: PrismaService,
  ) {}

  async authenticate(client: Socket): Promise<AuthenticatedSocketUser> {
    const token = this.extractToken(client)
    const payload = this.verifyAccessToken(token)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true },
    })
    if (!user?.isActive) throw new UnauthorizedException('SOCKET_USER_INACTIVE')

    const authenticated = { sub: user.id, role: user.role }
    client.data.user = authenticated
    return authenticated
  }

  getUser(client: Socket): AuthenticatedSocketUser | null {
    const user = client.data?.user as Partial<AuthenticatedSocketUser> | undefined
    if (!user?.sub || !Object.values(UserRole).includes(user.role as UserRole)) return null
    return { sub: user.sub, role: user.role as UserRole }
  }

  private extractToken(client: Socket): string {
    const authToken = client.handshake.auth?.token
    const authorization = client.handshake.headers?.authorization
    const headerToken = typeof authorization === 'string'
      ? authorization.replace(/^Bearer\s+/i, '')
      : undefined
    const token = typeof authToken === 'string' && authToken.trim()
      ? authToken.trim()
      : headerToken?.trim()
    if (!token) throw new UnauthorizedException('SOCKET_TOKEN_REQUIRED')
    return token
  }

  private verifyAccessToken(token: string): Required<Pick<AccessTokenPayload, 'sub'>> & AccessTokenPayload {
    const decoded = decode(token, { complete: true })
    const algorithm = decoded?.header.alg
    if (!algorithm) throw new UnauthorizedException('SOCKET_TOKEN_INVALID')

    const jwtSecret = this.config.get<string>('JWT_SECRET')
    if (!jwtSecret) throw new UnauthorizedException('SOCKET_AUTH_NOT_CONFIGURED')
    const legacyFallback = this.config.get<string>('LEGACY_HS256_FALLBACK') !== 'false'

    try {
      const key = this.ed25519.resolveKeyForAlg(algorithm, jwtSecret, legacyFallback)
      const payload = verify(token, key, {
        algorithms: [algorithm as Algorithm],
      }) as AccessTokenPayload
      if (!payload.sub || payload.type !== 'access') {
        throw new UnauthorizedException('SOCKET_ACCESS_TOKEN_REQUIRED')
      }
      return payload as Required<Pick<AccessTokenPayload, 'sub'>> & AccessTokenPayload
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      throw new UnauthorizedException('SOCKET_TOKEN_INVALID')
    }
  }
}
