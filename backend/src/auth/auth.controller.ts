import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, UsePipes } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AuthService, AuthResult } from './auth.service'
import { RegisterDto, LoginDto, RefreshDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto'
import { JwtAuthGuard } from './jwt-auth.guard'
import { RolesGuard } from './roles.guard'
import { Public } from './public.decorator'
import { CurrentUser } from './current-user.decorator'
import { SanitizedUser } from './auth.service'
import { publicAuthThrottle } from './auth-throttle'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.zod'

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
  @Throttle(publicAuthThrottle(3))
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
  @Throttle(publicAuthThrottle(5))
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

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset instructions' })
  @ApiResponse({ status: 200, description: 'Password reset request accepted' })
  @Throttle(publicAuthThrottle(3))
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto)
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with a one-time token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @Throttle(publicAuthThrottle(5))
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto)
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
