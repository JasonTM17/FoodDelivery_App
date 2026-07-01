import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator'

const STAFF_ROLES = ['owner', 'manager', 'kitchen', 'cashier', 'viewer'] as const
const CAPABILITIES = ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'] as const

export class InviteStaffDto {
  @IsArray()
  @IsString({ each: true })
  emails: string[]

  @IsIn(STAFF_ROLES)
  role: typeof STAFF_ROLES[number]

  @IsOptional()
  @IsArray()
  @IsIn(CAPABILITIES, { each: true })
  permissions?: string[]
}

export class UpdateStaffDto {
  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: typeof STAFF_ROLES[number]

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

  @IsString()
  startsAt: string

  @IsString()
  endsAt: string

  @IsOptional()
  @IsString()
  note?: string
}

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  startsAt?: string

  @IsOptional()
  @IsString()
  endsAt?: string

  @IsOptional()
  @IsString()
  note?: string

  @IsOptional()
  @IsIn(['scheduled', 'completed', 'cancelled'])
  status?: 'scheduled' | 'completed' | 'cancelled'
}
