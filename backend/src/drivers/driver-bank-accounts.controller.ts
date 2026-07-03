import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { DriverBankAccountsService } from './driver-bank-accounts.service'
import { DriverBankAccountInput, driverBankAccountSchema } from './driver-bank-accounts.zod'

@ApiTags('drivers')
@ApiBearerAuth()
@Controller('driver/bank-accounts')
@UseGuards(JwtAuthGuard)
@Roles('driver')
export class DriverBankAccountsController {
  constructor(private readonly bankAccountsService: DriverBankAccountsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.bankAccountsService.list(user.sub)
  }

  @Post()
  @UsePipes(new ZodValidationPipe(driverBankAccountSchema))
  create(@CurrentUser() user: JwtPayload, @Body() body: DriverBankAccountInput) {
    return this.bankAccountsService.create(user.sub, body)
  }

  @Patch(':accountId/default')
  setDefault(@CurrentUser() user: JwtPayload, @Param('accountId') accountId: string) {
    return this.bankAccountsService.setDefault(user.sub, accountId)
  }

  @Delete(':accountId')
  delete(@CurrentUser() user: JwtPayload, @Param('accountId') accountId: string) {
    return this.bankAccountsService.delete(user.sub, accountId)
  }
}
