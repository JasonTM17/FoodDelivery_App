import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

interface AiServicePayload {
  sub: string
  aud: string | string[]
  iat?: number
  exp?: number
}

@Injectable()
export class AiServiceJwtStrategy extends PassportStrategy(Strategy, 'ai-service-jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET')
    if (!secret) throw new Error('JWT_SECRET is not set')
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      audience: 'ai-service',
      algorithms: ['HS256'],
    })
  }

  validate(payload: AiServicePayload) {
    return { sub: payload.sub, aud: payload.aud }
  }
}
