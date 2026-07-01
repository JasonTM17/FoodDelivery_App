import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator'

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
  @IsString()
  submissionId: string

  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected'

  @IsOptional()
  @IsString()
  reason?: string
}
