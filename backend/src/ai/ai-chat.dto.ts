import { Transform } from 'class-transformer'
import { IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AiChatRequestDto {
  @ApiProperty({ minLength: 1, maxLength: 4000 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string

  @ApiPropertyOptional({ format: 'uuid' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsUUID()
  sessionId?: string

  @ApiPropertyOptional({ description: 'Customer-scoped order UUID or FoodFlow order code.' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @MaxLength(36)
  @Matches(/^(?:FD\d{10}|F[DF]-?\d{3,10}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i)
  orderId?: string
}
