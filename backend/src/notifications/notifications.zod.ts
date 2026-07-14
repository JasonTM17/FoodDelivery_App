import { z } from 'zod'

export const fcmTokenPlatforms = ['android', 'ios', 'web'] as const

export const fcmTokenSchema = z
  .string()
  .trim()
  .min(20, 'FCM token is too short')
  .max(500, 'FCM token is too long')

export const fcmRegistrationIdSchema = z.string().uuid('Invalid FCM registration ID')

export const registerFcmTokenSchema = z.object({
  token: fcmTokenSchema,
  platform: z.enum(fcmTokenPlatforms),
  deviceId: z.string().trim().min(1, 'Device ID cannot be empty').max(200).optional(),
  registrationId: fcmRegistrationIdSchema,
})

// Temporary rolling-upgrade adapter. New clients must send registrationId;
// the service maps old clients to a deterministic legacy registration ID.
export const legacyRegisterFcmTokenSchema = registerFcmTokenSchema.omit({
  registrationId: true,
}).strict()

export const compatibleRegisterFcmTokenSchema = z.union([
  registerFcmTokenSchema,
  legacyRegisterFcmTokenSchema,
])

export const unregisterFcmTokenSchema = z.object({
  token: fcmTokenSchema,
  registrationId: fcmRegistrationIdSchema,
})

export type RegisterFcmTokenInput = z.infer<typeof registerFcmTokenSchema>
export type LegacyRegisterFcmTokenInput = z.infer<typeof legacyRegisterFcmTokenSchema>
export type CompatibleRegisterFcmTokenInput = z.infer<
  typeof compatibleRegisterFcmTokenSchema
>
export type UnregisterFcmTokenInput = z.infer<typeof unregisterFcmTokenSchema>
