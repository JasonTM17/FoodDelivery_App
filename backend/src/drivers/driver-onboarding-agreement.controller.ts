import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { DriverOnboardingAgreementService } from './driver-onboarding-agreement.service'
import {
  AcceptDriverAgreementInput,
  acceptDriverAgreementSchema,
} from './driver-onboarding-agreement.zod'

@ApiTags('drivers')
@ApiBearerAuth()
@Controller('driver/onboarding/agreement')
@UseGuards(JwtAuthGuard)
@Roles('driver')
export class DriverOnboardingAgreementController {
  constructor(private readonly agreementService: DriverOnboardingAgreementService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(acceptDriverAgreementSchema))
  accept(@CurrentUser() user: JwtPayload, @Body() body: AcceptDriverAgreementInput) {
    return this.agreementService.accept(user.sub, body)
  }
}
