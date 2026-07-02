import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { MenuService } from './menu.service'
import { CreateCategoryDto, UpdateCategoryDto, CreateMenuItemDto, UpdateMenuItemDto, ReorderMenuEntityDto } from './menu.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { createCategorySchema, updateCategorySchema, createMenuItemSchema, updateMenuItemSchema, reorderMenuEntitySchema } from './menu.zod'
import { JwtAuthGuard } from '@/auth/jwt-auth.guard'
import { RolesGuard } from '@/auth/roles.guard'
import { Roles } from '@/auth/roles.decorator'
import { CurrentUser } from '@/auth/current-user.decorator'

@ApiTags('menu')
@Controller('restaurant/menu')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('restaurant')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getMenu(@CurrentUser() user: { id: string }) {
    return this.menuService.getMenu(user.id)
  }

  @Get('categories')
  getCategories(@CurrentUser() user: { id: string }) {
    return this.menuService.getCategories(user.id)
  }

  @Get('items')
  getItems(@CurrentUser() user: { id: string }) {
    return this.menuService.getItems(user.id)
  }

  @Get('items/:id')
  getItem(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.menuService.getItem(user.id, id)
  }

  @Post('categories')
  createCategory(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(createCategorySchema)) dto: CreateCategoryDto,
  ) {
    return this.menuService.createCategory(user.id, dto)
  }

  @Patch('categories/reorder')
  reorderCategories(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(reorderMenuEntitySchema)) dto: ReorderMenuEntityDto,
  ) {
    return this.menuService.reorderCategories(user.id, dto.items)
  }

  @Patch('categories/:id')
  updateCategory(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) dto: UpdateCategoryDto,
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
    @Body(new ZodValidationPipe(createMenuItemSchema)) dto: CreateMenuItemDto,
  ) {
    return this.menuService.createMenuItem(user.id, dto)
  }

  @Patch('items/reorder')
  reorderItems(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(reorderMenuEntitySchema)) dto: ReorderMenuEntityDto,
  ) {
    return this.menuService.reorderItems(user.id, dto.items)
  }

  @Patch('items/:id')
  updateMenuItem(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMenuItemSchema)) dto: UpdateMenuItemDto,
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
