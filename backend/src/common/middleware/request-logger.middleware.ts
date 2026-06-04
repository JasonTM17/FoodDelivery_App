import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now()
    const { method, originalUrl } = req

    res.on('finish', () => {
      const duration = Date.now() - start
      const { statusCode } = res
      if (statusCode >= 400) {
        this.logger.warn(`${method} ${originalUrl} ${statusCode} - ${duration}ms`)
      } else {
        this.logger.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`)
      }
    })

    next()
  }
}
