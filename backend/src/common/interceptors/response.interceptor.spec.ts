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
})
