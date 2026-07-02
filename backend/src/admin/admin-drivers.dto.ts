import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export const ADMIN_DRIVER_STATUSES = ['online', 'offline', 'delivering'] as const

export type AdminDriverStatus = typeof ADMIN_DRIVER_STATUSES[number]

export class AdminDriversQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string

  @IsOptional()
  @IsIn(ADMIN_DRIVER_STATUSES)
  status?: AdminDriverStatus

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20
}
