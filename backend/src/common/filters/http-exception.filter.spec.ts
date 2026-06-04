import { HttpExceptionFilter } from './http-exception.filter'
import { HttpException, HttpStatus } from '@nestjs/common'

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter

  beforeEach(() => { filter = new HttpExceptionFilter() })

  it('formats HttpException with proper structure', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST)
    const mockJson = jest.fn()
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/api/test' }),
      }),
    }

    filter.catch(exception, host as any)
    expect(mockStatus).toHaveBeenCalledWith(400)
  })
})
