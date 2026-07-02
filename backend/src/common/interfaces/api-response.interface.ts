export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export interface ApiErrorResponse {
  type: string
  title: string
  detail: string
  code: string
  status: number
  instance: string
  errors?: unknown
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
