import { Module } from '@nestjs/common'
import { SepayProvider } from './providers/sepay.provider'
import { CommissionService } from './commission.service'
import { PayoutLedgerService } from './payout-ledger.service'
import { RefundProcessor } from './refund.processor'
import { CommissionSplitProcessor } from './commission-split.processor'
import { QueueProviderModule } from '../common/queue/queue-provider.module'

@Module({
  imports: [
    QueueProviderModule.registerQueue(
      { name: 'payment-refund' },
      { name: 'commission-split' },
    ),
  ],
  providers: [
    SepayProvider,
    CommissionService,
    PayoutLedgerService,
    RefundProcessor,
    CommissionSplitProcessor,
  ],
  exports: [SepayProvider, CommissionService, PayoutLedgerService],
})
export class PaymentsModule {}
