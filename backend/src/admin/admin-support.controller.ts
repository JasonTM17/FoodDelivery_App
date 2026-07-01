import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AuditLog } from '../common/interceptors/audit-log.decorator'
import { CreateSupportMacroDto, SupportBulkDto, SupportCsatDto, SupportMessageDto } from './admin-support.dto'
import { AdminSupportService } from './admin-support.service'

@ApiTags('admin-support')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminSupportController {
  constructor(private readonly support: AdminSupportService) {}

  @Get('support-tickets/:id')
  getTicket(@Param('id') id: string) { return this.support.getTicket(id) }

  @Get('support-tickets/:id/messages')
  getMessages(@Param('id') id: string) { return this.support.getMessages(id) }

  @Post('support-tickets/:id/replies')
  @AuditLog({ action: 'support.reply', targetType: 'support_ticket', targetIdResolver: (_result, req) => String(req.params.id) })
  reply(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SupportMessageDto) {
    return this.support.addMessage(id, user.sub, dto.body, false)
  }

  @Post('support-tickets/:id/internal-notes')
  @AuditLog({ action: 'support.internal_note', targetType: 'support_ticket', targetIdResolver: (_result, req) => String(req.params.id) })
  internalNote(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SupportMessageDto) {
    return this.support.addMessage(id, user.sub, dto.body, true)
  }

  @Post('support-tickets/bulk')
  @AuditLog({ action: 'support.bulk_update', targetType: 'support_ticket' })
  bulk(@Body() dto: SupportBulkDto) { return this.support.bulk(dto) }

  @Get('support-agents')
  getAgents() { return this.support.getAgents() }

  @Get('support-macros')
  getMacros() { return this.support.getMacros() }

  @Post('support-macros')
  @AuditLog({ action: 'support.macro.create', targetType: 'support_macro' })
  createMacro(@CurrentUser() user: JwtPayload, @Body() dto: CreateSupportMacroDto) {
    return this.support.createMacro(user.sub, dto)
  }

  @Post('support-tickets/:id/csat')
  saveCsat(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SupportCsatDto) {
    return this.support.saveCsat(id, user.sub, dto)
  }
}
