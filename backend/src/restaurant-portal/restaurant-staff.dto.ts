import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

const MANAGEABLE_STAFF_ROLES = ['manager', 'kitchen', 'cashier', 'viewer'] as const
const CAPABILITIES = ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'] as const

export class InviteStaffDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true })
  emails: string[]

  @IsIn(MANAGEABLE_STAFF_ROLES)
  role: typeof MANAGEABLE_STAFF_ROLES[number]

  @IsOptional()
  @IsArray()
  @IsIn(CAPABILITIES, { each: true })
  permissions?: string[]
}

export class UpdateStaffDto {
  @IsOptional()
  @IsIn(MANAGEABLE_STAFF_ROLES)
  role?: typeof MANAGEABLE_STAFF_ROLES[number]

  @IsOptional()
  @IsArray()
  @IsIn(CAPABILITIES, { each: true })
  permissions?: string[]

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class CreateShiftDto {
  @IsString()
  restaurantProfileId: string

  @IsDateString()
  startsAt: string

  @IsDateString()
  endsAt: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string
}

export class UpdateShiftDto {
  @IsOptional()
  @IsDateString()
  startsAt?: string

  @IsOptional()
  @IsDateString()
  endsAt?: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string

  @IsOptional()
  @IsIn(['scheduled', 'completed', 'cancelled'])
  status?: 'scheduled' | 'completed' | 'cancelled'
}
