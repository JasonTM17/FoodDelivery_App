import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  )

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Phone must be a valid international phone number (e.g. +84123456789)')
  .optional()

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be at most 100 characters'),
    phone: phoneSchema,
  })
  .strict()

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export type RefreshInput = z.infer<typeof refreshSchema>

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
})

export type LogoutInput = z.infer<typeof logoutSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').max(512, 'Reset token is invalid'),
  password: passwordSchema,
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
