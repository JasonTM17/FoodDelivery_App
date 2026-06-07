'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Tag, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type PromoType = 'discount_percent' | 'discount_amount' | 'free_delivery';

interface PromoFormData {
  name: string;
  description: string;
  type: PromoType;
  discountValue: number;
  startDate: string;
  endDate: string;
  minOrderValue: number;
  maxUses: number;
  code: string;
}

const PROMO_TYPES: { id: PromoType; label: string; desc: string }[] = [
  { id: 'discount_percent', label: 'Giảm theo %', desc: 'Giảm giá theo phần trăm giá trị đơn hàng' },
  { id: 'discount_amount', label: 'Giảm số tiền cố định', desc: 'Giảm trực tiếp một số tiền nhất định' },
  { id: 'free_delivery', label: 'Miễn phí vận chuyển', desc: 'Miễn phí phí giao hàng cho khách hàng' },
];

const STEPS = ['Thông tin', 'Thời gian', 'Điều kiện', 'Xem lại'];

function generatePromoCode(name: string): string {
  const prefix = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'SALE';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

export function PromotionWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');
  const [form, setForm] = useState<PromoFormData>({
    name: '',
    description: '',
    type: 'discount_percent',
    discountValue: 10,
    startDate: '',
    endDate: '',
    minOrderValue: 0,
    maxUses: 100,
    code: '',
  });

  const update = <K extends keyof PromoFormData>(field: K, value: PromoFormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep = (): string => {
    if (step === 0) {
      if (!form.name.trim()) return 'Vui lòng nhập tên chương trình';
      if (form.type !== 'free_delivery' && form.discountValue <= 0)
        return 'Vui lòng nhập giá trị giảm giá hợp lệ';
      if (form.type === 'discount_percent' && form.discountValue > 100)
        return 'Phần trăm giảm không được vượt quá 100%';
    }
    if (step === 1) {
      if (!form.startDate) return 'Vui lòng chọn ngày bắt đầu';
      if (!form.endDate) return 'Vui lòng chọn ngày kết thúc';
      if (form.endDate < form.startDate) return 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (step === 2) {
      if (form.maxUses < 1) return 'Số lần dùng tối đa phải ít nhất là 1';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setStepError(err); return; }
    setStepError('');
    if (step === 2 && !form.code) {
      update('code', generatePromoCode(form.name));
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => { setStepError(''); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    const finalCode = form.code || generatePromoCode(form.name);
    setIsSubmitting(true);
    setStepError('');
    try {
      await api.post('/promotions', { ...form, code: finalCode });
      router.push('/menu');
    } catch (err: unknown) {
      setStepError((err as { message?: string }).message || 'Không thể tạo khuyến mãi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewRows: [string, string][] = [
    ['Tên', form.name],
    ['Loại', PROMO_TYPES.find((t) => t.id === form.type)?.label ?? ''],
    ...(form.type !== 'free_delivery'
      ? [[form.type === 'discount_percent' ? 'Giảm %' : 'Giảm tiền',
          `${form.discountValue}${form.type === 'discount_percent' ? '%' : ' VNĐ'}`] as [string, string]]
      : []),
    ['Bắt đầu', form.startDate],
    ['Kết thúc', form.endDate],
    ...(form.minOrderValue > 0
      ? [['Đơn tối thiểu', `${form.minOrderValue.toLocaleString('vi-VN')} VNĐ`] as [string, string]]
      : []),
    ['Mã', form.code || '(tự tạo khi tạo)'],
    ['Giới hạn', `${form.maxUses} lần`],
  ];

  return (
    <div>
      <button onClick={() => router.push('/menu')} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Quay lại
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <Tag className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tạo chương trình khuyến mãi</h1>
          <p className="text-sm text-gray-500">Thiết lập ưu đãi hấp dẫn cho khách hàng</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors shrink-0',
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-brand-600 text-white' :
              'bg-gray-100 text-gray-400'
            )}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-sm hidden sm:inline',
              i === step ? 'text-gray-900 font-medium' : 'text-gray-400'
            )}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-8 sm:w-12 shrink-0', i < step ? 'bg-green-400' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {stepError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{stepError}</p>
        </div>
      )}

      <div className="card max-w-2xl">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="label">Tên chương trình *</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
                className="input-field" placeholder="VD: Ưu đãi cuối tuần" />
            </div>
            <div>
              <label className="label">Mô tả</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                rows={2} className="input-field resize-none" placeholder="Mô tả ngắn về chương trình..." />
            </div>
            <div>
              <label className="label">Loại ưu đãi *</label>
              <div className="space-y-2 mt-1">
                {PROMO_TYPES.map((pt) => (
                  <label key={pt.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    form.type === pt.id ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  )}>
                    <input type="radio" name="promo-type" value={pt.id}
                      checked={form.type === pt.id} onChange={() => update('type', pt.id)}
                      className="mt-0.5 accent-brand-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pt.label}</p>
                      <p className="text-xs text-gray-500">{pt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {form.type !== 'free_delivery' && (
              <div>
                <label className="label">
                  {form.type === 'discount_percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'} *
                </label>
                <input type="number" value={form.discountValue}
                  onChange={(e) => update('discountValue', parseFloat(e.target.value) || 0)}
                  className="input-field" min="0"
                  max={form.type === 'discount_percent' ? 100 : undefined} />
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">Ngày bắt đầu *</label>
              <input type="date" value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Ngày kết thúc *</label>
              <input type="date" value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)} className="input-field"
                min={form.startDate || undefined} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label">Giá trị đơn hàng tối thiểu (VNĐ)</label>
              <input type="number" value={form.minOrderValue}
                onChange={(e) => update('minOrderValue', parseFloat(e.target.value) || 0)}
                className="input-field" min="0" placeholder="0 = không giới hạn" />
            </div>
            <div>
              <label className="label">Số lần dùng tối đa *</label>
              <input type="number" value={form.maxUses}
                onChange={(e) => update('maxUses', parseInt(e.target.value) || 1)}
                className="input-field" min="1" />
            </div>
            <div>
              <label className="label">Mã khuyến mãi</label>
              <div className="flex gap-2">
                <input type="text" value={form.code}
                  onChange={(e) => update('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="input-field flex-1 font-mono tracking-widest"
                  placeholder="Để trống để tự tạo" maxLength={12} />
                <button type="button"
                  onClick={() => update('code', generatePromoCode(form.name))}
                  className="btn-secondary text-xs shrink-0">
                  Tự tạo
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Chỉ dùng chữ hoa và số, tối đa 12 ký tự</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Xem lại thông tin</h3>
            <dl className="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
              {reviewRows.map(([key, val]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="text-gray-500 shrink-0">{key}</dt>
                  <dd className="font-medium text-gray-900 text-right">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
          <button onClick={handleBack} disabled={step === 0} className="btn-ghost" type="button">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Quay lại
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} className="btn-primary" type="button">
              Tiếp theo
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary" type="button">
              {isSubmitting ? 'Đang tạo...' : 'Tạo khuyến mãi'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
