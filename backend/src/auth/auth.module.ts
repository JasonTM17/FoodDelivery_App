import { Module, forwardRef } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { UsersModule } from '../users/users.module'
import { QUEUE_SMTP } from '../notifications/notifications.constants'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { JwtAuthGuard } from './jwt-auth.guard'
import { RefreshTokenStore } from './refresh-token.store'
import { Ed25519Service } from './keys/ed25519.service'
import { JwksController } from './keys/jwks.controller'
import { WebSocketAuthService } from './websocket-auth.service'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256' },
      }),
    }),
    BullModule.registerQueue({ name: QUEUE_SMTP }),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController, JwksController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RefreshTokenStore,
    Ed25519Service,
    WebSocketAuthService,
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule, Ed25519Service, WebSocketAuthService],
})
export class AuthModule {}
