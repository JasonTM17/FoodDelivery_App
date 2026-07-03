import { IsString, IsOptional, IsEnum, IsNumber, Min, IsUUID } from 'class-validator'

export enum PaymentMethodDto {
  cash = 'cash',
  wallet = 'wallet',
  sepay = 'sepay',
}

export class PlaceOrderDto {
  @IsUUID()
  addressId: string

  @IsEnum(PaymentMethodDto)
  paymentMethod: PaymentMethodDto = PaymentMethodDto.cash

  @IsString()
  @IsOptional()
  promotionCode?: string

  @IsString()
  @IsOptional()
  notes?: string
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string

  @IsString()
  @IsOptional()
  note?: string
}

export class CancelOrderDto {
  @IsString()
  @IsOptional()
  reason?: string
}

export class CreateReviewDto {
  @IsNumber()
  @Min(1)
  foodRating: number

  @IsNumber()
  @Min(1)
  deliveryRating: number

  @IsString()
  @IsOptional()
  comment?: string
}

export class CreateOrderChatMessageDto {
  @IsString()
  content: string
}
