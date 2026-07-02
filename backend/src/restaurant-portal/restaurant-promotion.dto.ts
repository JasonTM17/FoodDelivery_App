import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'
import { PartialType } from '@nestjs/swagger'

export class PromotionScheduleDto {
  @IsString()
  validFrom: string

  @IsString()
  validUntil: string

  @IsOptional()
  @IsObject()
  recurring?: Record<string, unknown>
}

export class CreateRestaurantPromotionDto {
  @IsString()
  @MaxLength(50)
  code: string

  @IsString()
  @MaxLength(150)
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsIn(['percent', 'fixed', 'bogof', 'combo', 'free_delivery'])
  type: string

  @IsNumber()
  @Min(0)
  discountValue: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderVnd?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountVnd?: number

  @IsIn(['all', 'category', 'items'])
  appliesTo: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[]

  @IsOptional()
  @IsObject()
  comboConfig?: Record<string, unknown>

  @IsObject()
  target: Record<string, unknown>

  @ValidateNested()
  @Type(() => PromotionScheduleDto)
  schedule: PromotionScheduleDto

  @IsArray()
  @IsIn(['in_app', 'push', 'email', 'sms'], { each: true })
  channels: string[]

  @IsBoolean()
  stackable: boolean

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsage?: number

  @IsInt()
  @Min(1)
  perUserLimit: number

  @IsOptional()
  @IsIn(['draft', 'scheduled', 'active', 'paused', 'expired', 'archived'])
  status?: string
}

export class UpdateRestaurantPromotionDto extends PartialType(CreateRestaurantPromotionDto) {}

export class BulkPromotionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[]

  @IsIn(['pause', 'resume', 'archive'])
  action: 'pause' | 'resume' | 'archive'
}

export class PromotionTargetingPreviewQueryDto {
  @IsIn(['all', 'new', 'vip', 'lapsed', 'segment', 'order_history'])
  audience: 'all' | 'new' | 'vip' | 'lapsed' | 'segment' | 'order_history'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minOrderCount?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  lastOrderWithinDays?: number

  @IsOptional()
  @IsString()
  segmentId?: string
}
