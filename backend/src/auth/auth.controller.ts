import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, UsePipes } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AuthService, AuthResult } from './auth.service'
import { RegisterDto, LoginDto, RefreshDto } from './auth.dto'
import { JwtAuthGuard } from './jwt-auth.guard'
import { RolesGuard } from './roles.guard'
import { Public } from './public.decorator'
import { CurrentUser } from './current-user.decorator'
import { SanitizedUser } from './auth.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from './auth.zod'

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(registerSchema))
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto)
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(loginSchema))
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto)
  }

  @Public()
  @Post('refresh')
  @UsePipes(new ZodValidationPipe(refreshSchema))
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto): Promise<AuthResult> {
    return this.authService.refresh(dto)
  }

  @Post('logout')
  @UsePipes(new ZodValidationPipe(logoutSchema))
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() _user: SanitizedUser,
    @Body() body: { refreshToken?: string },
  ): Promise<{ message: string }> {
    await this.authService.logout(body.refreshToken)
    return { message: 'Logged out successfully' }
  }
}
