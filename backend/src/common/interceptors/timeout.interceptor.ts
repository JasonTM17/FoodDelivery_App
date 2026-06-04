import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common'
import { Observable, TimeoutError } from 'rxjs'
import { timeout, catchError } from 'rxjs/operators'

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(30000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException('Request timeout')
        }
        throw err
      }),
    )
  }
}
