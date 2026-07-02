import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'

export class RestaurantOpeningHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number

  @IsString()
  openTime: string

  @IsString()
  closeTime: string

  @IsBoolean()
  isClosed: boolean
}

export class UpdateRestaurantProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressLine?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisineTypes?: string[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string

  @IsOptional()
  @Min(0)
  minOrderAmount?: number

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestaurantOpeningHourDto)
  openingHours?: RestaurantOpeningHourDto[]
}
