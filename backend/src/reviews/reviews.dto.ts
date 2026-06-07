import { IsInt, IsOptional, IsString, Min, Max, IsArray } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  foodRating: number

  @ApiProperty({ minimum: 1, maximum: 5, required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  deliveryRating?: number

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comment?: string

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  photos?: string[]
}

export class RestaurantReplyDto {
  @ApiProperty()
  @IsString()
  reply: string
}

export class AdminHideDto {
  @ApiProperty()
  @IsString()
  reason: string
}
