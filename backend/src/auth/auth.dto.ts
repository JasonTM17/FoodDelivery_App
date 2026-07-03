import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator'
import { UserRole } from '@prisma/client'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'Phone must be a valid international phone number (e.g. +84123456789)',
  })
  phone?: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class RefreshDto {
  @IsString()
  refreshToken: string
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @IsString()
  token: string

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string
}
