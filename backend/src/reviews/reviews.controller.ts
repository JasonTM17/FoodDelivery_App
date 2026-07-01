import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { ReviewsService } from './reviews.service'
import {
  createReviewSchema,
  restaurantReplySchema,
  adminHideSchema,
  CreateReviewInput,
  RestaurantReplyInput,
  AdminHideInput,
} from './reviews.zod'

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Post(':orderId')
  createReview(
    @Param('orderId') orderId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createReviewSchema)) dto: CreateReviewInput,
  ) {
    return this.service.createReview(orderId, user.sub, dto)
  }

  @Get('photos/upload-url')
  getPhotoUploadUrl(@Query('contentType') contentType?: string) {
    return this.service.getPhotoUploadUrl(contentType ?? 'image/jpeg')
  }

  @Patch(':id/hide')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  adminHide(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(adminHideSchema)) dto: AdminHideInput,
  ) {
    return this.service.adminHide(id, user.sub, dto.reason)
  }
}

@ApiTags('restaurant-reviews')
@ApiBearerAuth()
@Controller('restaurant/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.restaurant)
export class RestaurantReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get()
  getRestaurantReviews(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('rating') rating?: string,
  ) {
    return this.service.getRestaurantReviews(user.sub, Number(page), Number(limit), rating ? Number(rating) : undefined)
  }

  @Post(':id/reply')
  restaurantReply(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(restaurantReplySchema)) dto: RestaurantReplyInput,
  ) {
    return this.service.restaurantReply(id, user.sub, dto)
  }
}
