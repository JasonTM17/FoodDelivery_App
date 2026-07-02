import { Type } from 'class-transformer'
import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator'

export class AdminAuditQueryDto {
  @IsOptional()
  @IsString()
  actor?: string

  @IsOptional()
  @IsString()
  action?: string

  @IsOptional()
  @IsISO8601()
  dateFrom?: string

  @IsOptional()
  @IsISO8601()
  dateTo?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}
