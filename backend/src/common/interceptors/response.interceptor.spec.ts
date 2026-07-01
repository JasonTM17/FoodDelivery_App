import { ResponseInterceptor } from './response.interceptor'
import { ExecutionContext } from '@nestjs/common'
import { CallHandler } from '@nestjs/common'
import { of } from 'rxjs'

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>

  beforeEach(() => { interceptor = new ResponseInterceptor() })

  it('wraps successful response in { success: true, data }', (done) => {
    const context = { switchToHttp: () => ({ getResponse: () => ({ statusCode: 200 }) }) }
    const next = { handle: () => of({ id: 'test' }) }

    interceptor.intercept(context as unknown as ExecutionContext, next as unknown as CallHandler<unknown>).subscribe(result => {
      expect(result).toEqual({ success: true, data: { id: 'test' } })
      done()
    })
  })

  it('lifts { data, meta } responses into the standard success envelope', (done) => {
    const context = { switchToHttp: () => ({ getResponse: () => ({ statusCode: 200 }) }) }
    const next = {
      handle: () => of({
        data: [{ id: 'order-1' }],
        meta: { page: 1, limit: 20, total: 1 },
      }),
    }

    interceptor.intercept(context as unknown as ExecutionContext, next as unknown as CallHandler<unknown>).subscribe(result => {
      expect(result).toEqual({
        success: true,
        data: [{ id: 'order-1' }],
        meta: { page: 1, limit: 20, total: 1 },
      })
      done()
    })
  })

  it('keeps already wrapped responses unchanged', (done) => {
    const context = { switchToHttp: () => ({ getResponse: () => ({ statusCode: 200 }) }) }
    const next = {
      handle: () => of({
        success: true,
        data: { id: 'restaurant-1' },
        meta: { page: 1, limit: 1, total: 1 },
      }),
    }

    interceptor.intercept(context as unknown as ExecutionContext, next as unknown as CallHandler<unknown>).subscribe(result => {
      expect(result).toEqual({
        success: true,
        data: { id: 'restaurant-1' },
        meta: { page: 1, limit: 1, total: 1 },
      })
      done()
    })
  })
})
