import {
  IsString, IsOptional, IsNumber, IsInt, IsBoolean,
  Min, Max, MinLength, MaxLength, IsArray, ValidateNested, ArrayNotEmpty,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number

  @IsString()
  @IsOptional()
  parentId?: string

  @IsString()
  @IsOptional()
  icon?: string

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean
}

export class UpdateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number

  @IsString()
  @IsOptional()
  parentId?: string

  @IsString()
  @IsOptional()
  icon?: string

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean
}

export class CreateOptionValueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  value: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceModifier?: number
}

export class CreateOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean

  @IsBoolean()
  @IsOptional()
  isMultiple?: boolean

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionValueDto)
  values: CreateOptionValueDto[]
}

export class CreateMenuItemDto {
  @IsString()
  categoryId: string

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  imageUrl?: string

  @IsNumber()
  @Min(0)
  basePrice: number

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @IsOptional()
  options?: CreateOptionDto[]
}

export class UpdateMenuItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  imageUrl?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean

  @IsString()
  @IsOptional()
  categoryId?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @IsOptional()
  options?: CreateOptionDto[]
}

export class ReorderMenuEntityDto {
  @IsArray()
  @ArrayNotEmpty()
  items: Array<{ id: string; sortOrder: number }>
}
