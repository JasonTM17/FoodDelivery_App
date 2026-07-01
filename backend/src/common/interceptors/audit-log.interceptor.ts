import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { PrismaService } from '../../database/prisma.service'
import { Request } from 'express'

export const AUDIT_LOG_KEY = 'audit-log:meta'

export interface AuditLogMeta {
  action: string
  targetType: string
  targetIdResolver?: (result: unknown, req: Request) => string
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler()
    const meta = this.reflector.get<AuditLogMeta>(AUDIT_LOG_KEY, handler)
    if (!meta) return next.handle()

    const request = context.switchToHttp().getRequest<Request>()
    const reqAny = request as unknown as Record<string, unknown>
    const user = reqAny.user as Record<string, unknown> | undefined
    const actorId = (user?.['id'] ?? user?.['sub'] ?? 'system') as string
    const ip = request.ip ?? (reqAny['ip'] as string | undefined)
    const correlationId = request.headers['x-request-id'] as string | undefined
    const userAgent = request.headers['user-agent']

    return next.handle().pipe(
      tap({
        next: (result) => {
          const targetId = meta.targetIdResolver
            ? meta.targetIdResolver(result, request)
            : (result as Record<string, unknown>)?.['id'] as string | undefined

          this.prisma.adminAuditLog
            .create({
              data: {
                adminId: actorId,
                action: meta.action,
                targetType: meta.targetType,
                targetId: targetId ?? null,
                ipAddress: ip ?? '0.0.0.0',
                userAgent,
                correlationId,
                newValue: toJsonValue(result),
              },
            })
            .catch((err) => {
              this.logger.warn({ err, actorId, action: meta.action }, 'Failed to write audit log')
            })
        },
      }),
    )
  }
}

function toJsonValue(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return undefined
  }
}
