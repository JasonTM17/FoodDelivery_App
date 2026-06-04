import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const apiKey = request.headers['x-api-key'] as string
    const validKey = process.env.N8N_API_KEY

    if (!apiKey || !validKey || apiKey !== validKey) {
      throw new UnauthorizedException('Invalid or missing API key')
    }
    return true
  }
}
