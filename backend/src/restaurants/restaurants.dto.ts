import { IsString, IsOptional, IsNumber, Min, Max, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  radius: number = 5

  @IsString()
  @IsOptional()
  cuisine?: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 20
}

export class SearchQueryDto {
  @IsString()
  q: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 20
}
