import { z } from 'zod'

export const KYC_DOCUMENT_TYPES = [
  'idCardFront',
  'idCardBack',
  'driverLicense',
  'vehicleRegistration',
] as const

export const KYC_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const KYC_MIN_UPLOAD_BYTES = 1024

export const kycDocumentTypeSchema = z.enum(KYC_DOCUMENT_TYPES)
export const kycImageContentTypeSchema = z.enum(KYC_IMAGE_CONTENT_TYPES)

const kycObjectKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine(value => !value.includes('..') && !value.includes('\\') && !value.includes('://'), {
    message: 'KYC object key is invalid',
  })

const normalizedIdentifier = (min: number, max: number, pattern: RegExp) => z
  .string()
  .trim()
  .min(min)
  .max(max)
  .transform(value => value.toUpperCase())
  .refine(value => pattern.test(value), { message: 'Identifier contains unsupported characters' })

export const createKycUploadSchema = z.object({
  documentType: kycDocumentTypeSchema,
  contentType: kycImageContentTypeSchema,
  sizeBytes: z.number().int().min(KYC_MIN_UPLOAD_BYTES),
}).strict()

export const kycDocumentObjectsSchema = z.object({
  idCardFront: kycObjectKeySchema,
  idCardBack: kycObjectKeySchema,
  driverLicense: kycObjectKeySchema,
  vehicleRegistration: kycObjectKeySchema,
}).strict()

export const submitDriverKycSchema = z.object({
  licenseNumber: normalizedIdentifier(5, 50, /^[A-Z0-9./-]+$/),
  vehicleType: z.enum(['motorbike', 'car', 'bicycle']),
  vehiclePlate: normalizedIdentifier(5, 20, /^[A-Z0-9.-]+$/),
  documents: kycDocumentObjectsSchema,
}).strict()

export type KycDocumentType = z.infer<typeof kycDocumentTypeSchema>
export type KycImageContentType = z.infer<typeof kycImageContentTypeSchema>
export type CreateKycUploadInput = z.infer<typeof createKycUploadSchema>
export type SubmitDriverKycInput = z.infer<typeof submitDriverKycSchema>
export type KycDocumentObjects = SubmitDriverKycInput['documents']
