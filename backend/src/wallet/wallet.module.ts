import { Module } from '@nestjs/common'
import { PrismaModule } from '../database/prisma.module'
import { WalletController } from './wallet.controller'
import { WalletService } from './wallet.service'

@Module({
  imports: [PrismaModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
