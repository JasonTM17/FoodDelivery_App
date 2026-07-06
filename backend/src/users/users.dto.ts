import { Type } from 'class-transformer'
import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator'

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

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label!: string

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  addressLine!: string

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lat?: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lng?: number

  @IsString()
  @IsOptional()
  apartmentNumber?: string | null

  @IsString()
  @IsOptional()
  note?: string | null

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean
}

export class UpdateAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsOptional()
  label?: string

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  @IsOptional()
  addressLine?: string

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lat?: number

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lng?: number

  @IsString()
  @IsOptional()
  apartmentNumber?: string | null

  @IsString()
  @IsOptional()
  note?: string | null

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean
}
