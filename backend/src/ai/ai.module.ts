import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { AiController } from './ai.controller'
import { AiToolsController } from './ai-tools.controller'
import { ChatClassifyController } from './chat-classify.controller'
import { AiToolsService } from './ai-tools.service'
import { AiServiceJwtStrategy } from './ai-service-jwt.strategy'

@Module({
  imports: [PassportModule],
  controllers: [AiController, AiToolsController, ChatClassifyController],
  providers: [AiToolsService, AiServiceJwtStrategy],
})
export class AiModule {}
