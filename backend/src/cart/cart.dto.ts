import { IsString, IsInt, IsOptional, Min, IsArray, ValidateNested, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

export class AddCartItemDto {
  @IsString()
  restaurantId: string

  @IsString()
  menuItemId: string

  @IsInt()
  @Min(1)
  quantity: number = 1

  @IsArray()
  @IsOptional()
  selectedOptions?: { optionId: string; valueId: string }[]

  @IsString()
  @IsOptional()
  notes?: string
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number

  @IsString()
  @IsOptional()
  notes?: string
}

export class ApplyPromotionDto {
  @IsString()
  code: string
}
