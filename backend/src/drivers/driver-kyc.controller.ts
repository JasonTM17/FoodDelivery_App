import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { DriverKycService } from './driver-kyc.service'
import {
  createKycUploadSchema,
  submitDriverKycSchema,
  type CreateKycUploadInput,
  type SubmitDriverKycInput,
} from './driver-kyc.zod'

@ApiTags('drivers')
@ApiBearerAuth()
@Controller('driver/kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('driver')
export class DriverKycController {
  constructor(private readonly service: DriverKycService) {}

  @Post('uploads')
  createUploadGrant(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createKycUploadSchema)) input: CreateKycUploadInput,
  ) {
    return this.service.createUploadGrant(user.sub, input)
  }

  @Post()
  submit(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(submitDriverKycSchema)) input: SubmitDriverKycInput,
  ) {
    return this.service.submit(user.sub, input)
  }

  @Get('status')
  getStatus(@CurrentUser() user: JwtPayload) {
    return this.service.getStatus(user.sub)
  }
}
