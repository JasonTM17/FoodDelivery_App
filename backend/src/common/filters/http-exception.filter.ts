import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { redactSensitiveRequestPath } from '../middleware/request-logger.middleware'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let code = 'INTERNAL_ERROR'
    let errors: unknown

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      code = this.getCodeFromStatus(status)
      const exResponse = exception.getResponse()

      if (typeof exResponse === 'string') {
        message = exResponse
      } else if (typeof exResponse === 'object') {
        const resp = exResponse as Record<string, unknown>
        if (Array.isArray(resp.message)) {
          message = 'Validation failed'
          errors = resp.message
        } else if (typeof resp.message === 'string') {
          message = resp.message
        } else {
          message = exception.message
        }

        code = typeof resp.code === 'string' ? resp.code : code
        errors ??= resp.details
      }
    }

    const problem = {
      type: 'about:blank',
      title: this.getTitleFromStatus(status),
      detail: message,
      code,
      status,
      instance: redactSensitiveRequestPath(request.url),
      ...(errors === undefined ? {} : { errors }),
    }

    response.status(status).type('application/problem+json').json(problem)
  }

  private getTitleFromStatus(status: number): string {
    const statusName = HttpStatus[status] ?? 'Error'
    return statusName
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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
