import { IsString, IsOptional, IsUrl, MinLength, MaxLength } from 'class-validator'

export class UpdateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  fullName?: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsUrl()
  @IsOptional()
  avatarUrl?: string
}
