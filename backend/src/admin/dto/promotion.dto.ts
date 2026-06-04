import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
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
