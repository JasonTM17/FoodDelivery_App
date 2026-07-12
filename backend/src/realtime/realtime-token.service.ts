import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserRole } from '@prisma/client'
import { sign } from 'jsonwebtoken'
import { normalizePem } from '../common/supabase/supabase-config'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { PrismaService } from '../database/prisma.service'
import { realtimeChannels } from './realtime-channels'

export interface RealtimeTokenRequest {
  orderId?: string
  restaurantId?: string
}

export interface RealtimeTokenResponse {
  provider: 'supabase'
  token: string
  expiresAt: string
  channels: string[]
}

const REALTIME_TOKEN_TTL_SECONDS = 5 * 60
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

@Injectable()
export class RealtimeTokenService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async issueToken(user: JwtPayload, body: RealtimeTokenRequest = {}): Promise<RealtimeTokenResponse> {
    const privateKey = this.config.get<string>('SUPABASE_REALTIME_JWT_PRIVATE_KEY')
    const keyId = this.config.get<string>('SUPABASE_REALTIME_JWT_KEY_ID')
    if (!privateKey || !keyId) {
      throw new InternalServerErrorException('SUPABASE_REALTIME_NOT_CONFIGURED')
    }

    const channels = await this.resolveChannels(user, body)
    const nowSeconds = Math.floor(Date.now() / 1000)
    const expiresAtSeconds = nowSeconds + REALTIME_TOKEN_TTL_SECONDS
    const token = sign(
      {
        aud: 'authenticated',
        role: 'authenticated',
        sub: user.sub,
        app_role: user.role,
        realtime_channels: channels,
        iat: nowSeconds,
        exp: expiresAtSeconds,
      },
      normalizePem(privateKey),
      { algorithm: 'ES256', keyid: keyId },
    )

    return {
      provider: 'supabase',
      token,
      expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
      channels,
    }
  }

  private async resolveChannels(user: JwtPayload, body: RealtimeTokenRequest): Promise<string[]> {
    const channels = new Set<string>([realtimeChannels.userNotifications(user.sub)])
    const role = user.role as UserRole

    if (role === UserRole.admin) {
      channels.add(realtimeChannels.adminOrders)
      channels.add(realtimeChannels.adminDrivers)
    }

    if (role === UserRole.driver) {
      channels.add(realtimeChannels.driver(user.sub))
    }

    if (body.restaurantId) {
      if (!isUuid(body.restaurantId) || !(await this.canAccessRestaurant(user, body.restaurantId))) {
        throw new ForbiddenException('REALTIME_RESTAURANT_CHANNEL_FORBIDDEN')
      }
      channels.add(realtimeChannels.restaurant(body.restaurantId))
    }

    if (body.orderId) {
      if (!isUuid(body.orderId) || !(await this.canAccessOrder(user, body.orderId))) {
        throw new ForbiddenException('REALTIME_ORDER_CHANNEL_FORBIDDEN')
      }
      channels.add(realtimeChannels.order(body.orderId))
      if (role === UserRole.restaurant || role === UserRole.driver) {
        channels.add(realtimeChannels.restaurantDriverChat(body.orderId))
      }
    }

    return [...channels].sort()
  }

  private async canAccessOrder(user: JwtPayload, orderId: string): Promise<boolean> {
    if (user.role === UserRole.admin) return true
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, driverId: true, restaurantId: true },
    })
    if (!order) return false
    if (user.role === UserRole.customer) return order.customerId === user.sub
    if (user.role === UserRole.driver) return order.driverId === user.sub
    if (user.role !== UserRole.restaurant) return false
    return this.canAccessRestaurant(user, order.restaurantId)
  }

  private async canAccessRestaurant(user: JwtPayload, restaurantId: string): Promise<boolean> {
    if (user.role !== UserRole.restaurant) return false
    const profile = await this.prisma.restaurantProfile.findFirst({
      where: {
        userId: user.sub,
        restaurantId,
        isActive: true,
      },
      select: { id: true },
    })
    return Boolean(profile)
  }
}

function isUuid(value: string): boolean {
  return uuidPattern.test(value)
}
