import { HttpExceptionFilter } from './http-exception.filter'
import { HttpException, HttpStatus } from '@nestjs/common'

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter

  beforeEach(() => { filter = new HttpExceptionFilter() })

  it('formats HttpException as RFC 7807 problem details', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST)
    const mockJson = jest.fn()
    const mockType = jest.fn().mockReturnValue({ json: mockJson })
    const mockStatus = jest.fn().mockReturnValue({ type: mockType })
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/api/test' }),
      }),
    }

    filter.catch(exception, host as any)
    expect(mockStatus).toHaveBeenCalledWith(400)
    expect(mockType).toHaveBeenCalledWith('application/problem+json')
    expect(mockJson).toHaveBeenCalledWith({
      type: 'about:blank',
      title: 'Bad Request',
      detail: 'Test error',
      code: 'BAD_REQUEST',
      status: 400,
      instance: '/api/test',
    })
  })

  it('exposes validation issues without nesting a legacy error object', () => {
    const exception = new HttpException(
      { message: ['email is invalid'], code: 'VALIDATION_ERROR' },
      HttpStatus.BAD_REQUEST,
    )
    const mockJson = jest.fn()
    const mockType = jest.fn().mockReturnValue({ json: mockJson })
    const mockStatus = jest.fn().mockReturnValue({ type: mockType })
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/api/auth/register' }),
      }),
    }

    filter.catch(exception, host as any)

    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      detail: 'Validation failed',
      code: 'VALIDATION_ERROR',
      status: 400,
      errors: ['email is invalid'],
    }))
  })
})
