import { Module, forwardRef } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { JwtAuthGuard } from './jwt-auth.guard'
import { RefreshTokenStore } from './refresh-token.store'
import { Ed25519Service } from './keys/ed25519.service'
import { JwksController } from './keys/jwks.controller'

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
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController, JwksController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RefreshTokenStore, Ed25519Service],
  exports: [AuthService, JwtAuthGuard, JwtModule, Ed25519Service],
})
export class AuthModule {}
