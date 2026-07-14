import { HttpExceptionFilter } from './http-exception.filter'
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'

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

    filter.catch(exception, host as unknown as ArgumentsHost)
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

  it('redacts legacy FCM tokens from problem instances', () => {
    const token = 'sensitive-fcm-token-with-at-least-twenty-characters'
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND)
    const mockJson = jest.fn()
    const mockType = jest.fn().mockReturnValue({ json: mockJson })
    const mockStatus = jest.fn().mockReturnValue({ type: mockType })
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({
          url: `/api/notifications/fcm-token/${token}`,
        }),
      }),
    }

    filter.catch(exception, host as unknown as ArgumentsHost)

    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      instance: '/api/notifications/fcm-token/[REDACTED]',
    }))
    expect(JSON.stringify(mockJson.mock.calls)).not.toContain(token)
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

    filter.catch(exception, host as unknown as ArgumentsHost)

    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      detail: 'Validation failed',
      code: 'VALIDATION_ERROR',
      status: 400,
      errors: ['email is invalid'],
    }))
  })
})
