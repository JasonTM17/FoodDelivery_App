import { z } from 'zod';

export type PromotionValidationKey =
  | 'codeMin'
  | 'codeMax'
  | 'codeFormat'
  | 'nameMin'
  | 'nameMax'
  | 'discountType'
  | 'positiveValue'
  | 'invalidDate'
  | 'dateOrder';

type PromotionValidationMessage = (key: PromotionValidationKey) => string;

const optionalPositiveNumber = z.preprocess(
  value => value === '' || value === null || value === undefined ? undefined : value,
  z.coerce.number().positive().optional(),
);

export function createPromotionSchema(message: PromotionValidationMessage) {
  return z.object({
    code: z
      .string()
      .min(3, message('codeMin'))
      .max(20, message('codeMax'))
      .regex(/^[A-Z0-9_]+$/, message('codeFormat')),
    name: z
      .string()
      .min(5, message('nameMin'))
      .max(100, message('nameMax')),
    discountType: z.enum(['percent', 'fixed', 'bogo', 'shipping', 'combo'], {
      errorMap: () => ({ message: message('discountType') }),
    }),
    discountValue: z.coerce.number().positive(message('positiveValue')),
    minOrderVnd: z.coerce.number().nonnegative().optional(),
    maxDiscountVnd: optionalPositiveNumber,
    audience: z.enum(['all', 'new', 'vip', 'segment']),
    segmentId: z.string().optional(),
    validFrom: z.coerce.date({ errorMap: () => ({ message: message('invalidDate') }) }),
    validUntil: z.coerce.date({ errorMap: () => ({ message: message('invalidDate') }) }),
    maxUsage: optionalPositiveNumber.pipe(z.number().int().positive().optional()),
    perUserLimit: z.coerce.number().int().positive().default(1),
    description: z.string().max(500).optional(),
    active: z.boolean().default(true),
  }).refine(data => data.validFrom < data.validUntil, {
    message: message('dateOrder'),
    path: ['validUntil'],
  });
}

export type PromotionFormValues = z.infer<ReturnType<typeof createPromotionSchema>>;
