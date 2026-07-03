import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PromotionForm } from '@/components/promotions/promotion-form';

vi.mock('@/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock('@/components/promotions/promotion-type-picker', () => ({
  PromotionTypePicker: () => <div data-testid="promotion-type-picker" />,
}));

vi.mock('@/components/promotions/promotion-target-selector', () => ({
  PromotionTargetSelector: () => <div data-testid="promotion-target-selector" />,
}));

vi.mock('@/components/promotions/promotion-schedule-editor', () => ({
  PromotionScheduleEditor: () => <div data-testid="promotion-schedule-editor" />,
}));

vi.mock('@/components/promotions/promotion-channel-selector', () => ({
  PromotionChannelSelector: () => <div data-testid="promotion-channel-selector" />,
}));

vi.mock('@/components/promotions/promotion-combo-builder', () => ({
  PromotionComboBuilder: () => <div data-testid="promotion-combo-builder" />,
}));

vi.mock('@/components/promotions/promotion-form-sections', () => ({
  PromotionApplyScopeSection: () => <div data-testid="promotion-apply-scope-section" />,
  PromotionLimitsSection: () => <div data-testid="promotion-limits-section" />,
}));

vi.mock('@/components/shared/audience-preview', () => ({
  AudiencePreview: () => <div data-testid="audience-preview" />,
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, string> = {
      'promotions.form.back': 'Back',
      'promotions.form.errorsTitle': 'Please fix the following errors:',
      'promotions.form.basicTitle': 'Basic information',
      'promotions.form.code': 'Promotion code *',
      'promotions.form.codePlaceholder': 'E.g. WELCOME20',
      'promotions.form.name': 'Promotion name *',
      'promotions.form.namePlaceholder': 'E.g. Welcome 20%',
      'promotions.form.description': 'Description',
      'promotions.form.typeTitle': 'Promotion type',
      'promotions.form.percentValue': 'Percent discount *',
      'promotions.form.fixedValue': 'Fixed discount *',
      'promotions.form.maxDiscount': 'Maximum discount (VND)',
      'promotions.form.minOrder': 'Minimum order (VND)',
      'promotions.form.create': 'Create promotion',
      'promotions.form.update': 'Update promotion',
      'promotions.form.saving': 'Saving...',
    };
    return messages[`${namespace}.${key}`] ?? key;
  },
}));

describe('PromotionForm', () => {
  it('uses localized copy for the promotion code placeholder', () => {
    render(<PromotionForm onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText('E.g. WELCOME20')).toBeVisible();
    expect(screen.queryByPlaceholderText('VD: WELCOME20')).not.toBeInTheDocument();
  });
});
