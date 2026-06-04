import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

export interface WrappedResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, WrappedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<WrappedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (this.isWrapped(data)) {
          return data as unknown as WrappedResponse<T>
        }

        if (this.isPaginated(data)) {
          const { items, ...meta } = data as {
            items: unknown
            page: number
            limit: number
            total: number
          }
          return { success: true as const, data: items as T, meta }
        }

        return { success: true as const, data }
      }),
    )
  }

  private isWrapped(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      'success' in value &&
      (value as Record<string, unknown>).success === true
    )
  }

  private isPaginated(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false
    const obj = value as Record<string, unknown>
    return (
      'items' in obj &&
      'page' in obj &&
      'limit' in obj &&
      'total' in obj &&
      typeof obj.page === 'number' &&
      typeof obj.limit === 'number' &&
      typeof obj.total === 'number'
    )
  }
}
