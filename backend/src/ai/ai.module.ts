import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AiChatController } from './ai-chat.controller'
import { AiGroundingService } from './ai-grounding.service'
import { AiToolsService } from './ai-tools.service'
import { AiChatService } from './ai-chat.service'
import { DeepSeekChatProviderService } from './deepseek-chat-provider.service'
import { ConversationMemoryService } from './conversation-memory.service'
import { SentimentDetectionService } from './sentiment-detection.service'
import { ToolJustificationService } from './tool-justification.service'
import { OutputFilterService } from './output-filter.service'
import { NotificationsModule } from '../notifications/notifications.module'
import { RagModule } from './rag/rag.module'

@Module({
  imports: [NotificationsModule, RagModule],
  controllers: [AiController, AiChatController],
  providers: [
    AiToolsService,
    AiChatService,
    DeepSeekChatProviderService,
    AiGroundingService,
    ConversationMemoryService,
    SentimentDetectionService,
    ToolJustificationService,
    OutputFilterService,
  ],
  exports: [AiChatService, ConversationMemoryService, SentimentDetectionService, ToolJustificationService, OutputFilterService],
})
export class AiModule {}
