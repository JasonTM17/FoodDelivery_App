import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common'
import { MenuService } from './menu.service'
import { CreateCategoryDto, UpdateCategoryDto, CreateMenuItemDto, UpdateMenuItemDto } from './menu.dto'
import { JwtAuthGuard } from '@/auth/jwt-auth.guard'
import { RolesGuard } from '@/auth/roles.guard'
import { Roles } from '@/auth/roles.decorator'
import { CurrentUser } from '@/auth/current-user.decorator'

@Controller('restaurant/menu')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('restaurant')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getMenu(@CurrentUser() user: { id: string }) {
    return this.menuService.getMenu(user.id)
  }

  @Post('categories')
  createCategory(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCategoryDto,
  ) {
    return this.menuService.createCategory(user.id, dto)
  }

  @Patch('categories/:id')
  updateCategory(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.menuService.updateCategory(user.id, id, dto)
  }

  @Delete('categories/:id')
  deleteCategory(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.menuService.deleteCategory(user.id, id)
  }

  @Post('items')
  createMenuItem(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menuService.createMenuItem(user.id, dto)
  }

  @Patch('items/:id')
  updateMenuItem(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateMenuItem(user.id, id, dto)
  }

  @Delete('items/:id')
  deleteMenuItem(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.menuService.deleteMenuItem(user.id, id)
  }

  @Patch('items/:id/toggle')
  toggleMenuItem(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.menuService.toggleMenuItem(user.id, id)
  }
}
