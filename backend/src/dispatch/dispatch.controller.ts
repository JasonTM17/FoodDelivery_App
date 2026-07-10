import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { DispatchOfferService } from './dispatch-offer.service'
import { DispatchOfferResponseBody, dispatchOfferResponseSchema } from './dispatch.zod'

@ApiTags('drivers')
@ApiBearerAuth()
@Controller('driver/dispatch/offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.driver)
export class DispatchController {
  constructor(private readonly offers: DispatchOfferService) {}

  @Post(':orderId/respond')
  @HttpCode(200)
  @ApiOperation({ summary: 'Accept or reject a short-lived dispatch offer' })
  @ApiResponse({ status: 200, description: 'Offer resolved exactly once for the authenticated driver' })
  @ApiResponse({ status: 409, description: 'Offer token is invalid, expired, or already resolved' })
  respond(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(dispatchOfferResponseSchema)) body: DispatchOfferResponseBody,
  ) {
    return this.offers.respondToOffer(orderId, user.sub, body.offerToken, body.decision)
  }
}
