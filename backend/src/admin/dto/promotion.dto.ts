import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsObject,
  IsDateString,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator'
import { PromotionType } from '@prisma/client'
import { Type } from 'class-transformer'

export class CreatePromotionDto {
  @IsString()
  @MaxLength(50)
  code: string

  @IsString()
  @MaxLength(150)
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(PromotionType)
  type: PromotionType

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  value: number

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @IsOptional()
  minOrderAmount?: number

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @IsOptional()
  maxDiscount?: number

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  usageLimit: number

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  @IsOptional()
  maxPerUser?: number

  @IsObject()
  @IsOptional()
  targeting?: Record<string, unknown>

  @IsDateString()
  startsAt: string

  @IsDateString()
  expiresAt: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

export class UpdatePromotionDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  code?: string

  @IsString()
  @MaxLength(150)
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(PromotionType)
  @IsOptional()
  type?: PromotionType

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @IsOptional()
  value?: number

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @IsOptional()
  minOrderAmount?: number

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @IsOptional()
  maxDiscount?: number

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  @IsOptional()
  usageLimit?: number

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  @IsOptional()
  maxPerUser?: number

  @IsObject()
  @IsOptional()
  targeting?: Record<string, unknown>

  @IsDateString()
  @IsOptional()
  startsAt?: string

  @IsDateString()
  @IsOptional()
  expiresAt?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

export class PromotionQueryDto {
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number
}
