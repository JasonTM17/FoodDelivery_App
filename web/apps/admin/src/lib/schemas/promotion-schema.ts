import { z } from 'zod';

export const promotionSchema = z.object({
  code: z
    .string()
    .min(3, 'Mã khuyến mãi cần ít nhất 3 ký tự')
    .max(20, 'Mã khuyến mãi tối đa 20 ký tự')
    .regex(/^[A-Z0-9_]+$/, 'Mã chỉ chứa chữ in hoa, số và gạch dưới'),
  name: z
    .string()
    .min(5, 'Tên khuyến mãi cần ít nhất 5 ký tự')
    .max(100, 'Tên khuyến mãi tối đa 100 ký tự'),
  discountType: z.enum(['percent', 'fixed', 'bogo', 'shipping'], {
    errorMap: () => ({ message: 'Loại giảm giá không hợp lệ' }),
  }),
  discountValue: z.coerce.number().positive('Giá trị phải là số dương'),
  minOrderVnd: z.coerce.number().nonnegative().optional(),
  maxDiscountVnd: z.coerce.number().positive().optional(),
  audience: z.enum(['all', 'new', 'vip', 'segment']),
  segmentId: z.string().optional(),
  validFrom: z.coerce.date({ errorMap: () => ({ message: 'Ngày không hợp lệ' }) }),
  validUntil: z.coerce.date({ errorMap: () => ({ message: 'Ngày không hợp lệ' }) }),
  maxUsage: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().default(1),
  description: z.string().max(500).optional(),
  active: z.boolean().default(true),
}).refine((d) => d.validFrom < d.validUntil, {
  message: 'Ngày bắt đầu phải trước ngày kết thúc',
  path: ['validUntil'],
});

export type PromotionFormValues = z.infer<typeof promotionSchema>;
