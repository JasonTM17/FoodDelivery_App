import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class SupportMessageDto {
  @IsString()
  body: string
}

export class SupportBulkDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[]

  @IsIn(['assign', 'status', 'priority', 'tag'])
  action: string

  @IsString()
  value: string
}

export class CreateSupportMacroDto {
  @IsString()
  name: string

  @IsString()
  body: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

export class SupportCsatDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number

  @IsOptional()
  @IsString()
  comment?: string
}
