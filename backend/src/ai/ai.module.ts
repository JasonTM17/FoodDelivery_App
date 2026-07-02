import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { AiController } from './ai.controller'
import { AiToolsController } from './ai-tools.controller'
import { AiChatController } from './ai-chat.controller'
import { ChatClassifyController } from './chat-classify.controller'
import { AiToolsService } from './ai-tools.service'
import { AiChatService } from './ai-chat.service'
import { AiServiceJwtStrategy } from './ai-service-jwt.strategy'
import { ConversationMemoryService } from './conversation-memory.service'
import { SentimentDetectionService } from './sentiment-detection.service'
import { ToolJustificationService } from './tool-justification.service'
import { OutputFilterService } from './output-filter.service'

@Module({
  imports: [PassportModule],
  controllers: [AiController, AiChatController, AiToolsController, ChatClassifyController],
  providers: [
    AiToolsService,
    AiChatService,
    AiServiceJwtStrategy,
    ConversationMemoryService,
    SentimentDetectionService,
    ToolJustificationService,
    OutputFilterService,
  ],
  exports: [AiChatService, ConversationMemoryService, SentimentDetectionService, ToolJustificationService, OutputFilterService],
})
export class AiModule {}
