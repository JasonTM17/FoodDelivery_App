import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'

export class AdminOrderStatusDto {
  @IsString()
  status: string

  @IsOptional()
  @IsString()
  note?: string
}

export class RestaurantReviewDto {
  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsString()
  reason?: string
}

export class RestaurantMenuAvailabilityDto {
  @IsBoolean()
  available: boolean
}

export class KycReviewDto {
  @IsUUID()
  submissionId: string

  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected'

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string
}
