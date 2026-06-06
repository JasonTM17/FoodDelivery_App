import { Controller, Get, Param, Query, UseGuards, UsePipes } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { RestaurantsService } from './restaurants.service'
import { NearbyQueryDto, SearchQueryDto } from './restaurants.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { nearbyQuerySchema, searchQuerySchema } from './restaurants.zod'
import { JwtAuthGuard } from '@/auth/jwt-auth.guard'
import { Public } from '@/auth/public.decorator'

@ApiTags('restaurants')
@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get('nearby')
  @Public()
  @UsePipes(new ZodValidationPipe(nearbyQuerySchema))
  findNearby(@Query() query: NearbyQueryDto) {
    return this.restaurantsService.findNearby(query)
  }

  @Get('search')
  @Public()
  @UsePipes(new ZodValidationPipe(searchQuerySchema))
  search(@Query() query: SearchQueryDto) {
    return this.restaurantsService.search(query)
  }

  @Get(':id')
  @Public()
  getDetail(@Param('id') id: string) {
    return this.restaurantsService.getDetail(id)
  }

  @Get(':id/menu')
  @Public()
  getMenu(@Param('id') id: string) {
    return this.restaurantsService.getMenu(id)
  }

  @Get(':id/reviews')
  @Public()
  getReviews(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.restaurantsService.getReviews(id, Number(page) || 1, Number(limit) || 10)
  }
}
