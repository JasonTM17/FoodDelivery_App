export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  timestamp: string
  path: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
