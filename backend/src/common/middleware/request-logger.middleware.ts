import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

export function redactSensitiveRequestPath(originalUrl: string): string {
  const [pathname = '/'] = originalUrl.split('?', 1)
  return (pathname || '/').replace(
    /(\/notifications\/fcm-token\/)[^/?#]+/g,
    '$1[REDACTED]',
  )
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now()
    const { method } = req
    const requestPath = redactSensitiveRequestPath(req.originalUrl)

    res.on('finish', () => {
      const duration = Date.now() - start
      const { statusCode } = res
      if (statusCode >= 400) {
        this.logger.warn(`${method} ${requestPath} ${statusCode} - ${duration}ms`)
      } else {
        this.logger.log(`${method} ${requestPath} ${statusCode} - ${duration}ms`)
      }
    })

    next()
  }
}
