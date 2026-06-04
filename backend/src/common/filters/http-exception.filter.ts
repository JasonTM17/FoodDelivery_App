import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let code = 'INTERNAL_ERROR'
    let details: Record<string, unknown> = {}

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exResponse = exception.getResponse()

      if (typeof exResponse === 'string') {
        message = exResponse
      } else if (typeof exResponse === 'object') {
        const resp = exResponse as Record<string, unknown>
        message = (resp.message as string) ?? exception.message
        code = (resp.code as string) ?? this.getCodeFromStatus(status)
        details = resp.details as Record<string, unknown> ?? {}

        if (Array.isArray(resp.message)) {
          message = 'Validation failed'
          details = { errors: resp.message }
        }
      }
    }

    response.status(status).json({
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST'
      case 401: return 'UNAUTHORIZED'
      case 403: return 'FORBIDDEN'
      case 404: return 'NOT_FOUND'
      case 409: return 'CONFLICT'
      case 422: return 'UNPROCESSABLE_ENTITY'
      case 429: return 'TOO_MANY_REQUESTS'
      default: return 'INTERNAL_ERROR'
    }
  }
}
