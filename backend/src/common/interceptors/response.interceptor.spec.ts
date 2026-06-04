import { ResponseInterceptor } from './response.interceptor'
import { of } from 'rxjs'

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor

  beforeEach(() => { interceptor = new ResponseInterceptor() })

  it('wraps successful response in { success: true, data }', (done) => {
    const context = { switchToHttp: () => ({ getResponse: () => ({ statusCode: 200 }) }) }
    const next = { handle: () => of({ id: 'test' }) }

    interceptor.intercept(context as any, next as any).subscribe(result => {
      expect(result).toEqual({ success: true, data: { id: 'test' } })
      done()
    })
  })
})
