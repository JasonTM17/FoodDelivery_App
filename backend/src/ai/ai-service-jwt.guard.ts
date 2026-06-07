import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class AiServiceJwtGuard extends AuthGuard('ai-service-jwt') {}
