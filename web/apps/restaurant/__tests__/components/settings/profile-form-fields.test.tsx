import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  BasicInfoFields,
  OperationsFields,
  canonicalizeCuisineValues,
} from '@/components/settings/profile-form-fields';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('canonicalizeCuisineValues', () => {
  it('maps legacy accented cuisine labels to stable profile values', () => {
    expect(canonicalizeCuisineValues(['Việt Nam', 'Hải sản', 'Bánh mì'])).toEqual([
      'vietnamese',
      'seafood',
      'banh_mi',
    ]);
  });

  it('keeps unknown cuisine values so profile saves do not drop existing data', () => {
    expect(canonicalizeCuisineValues(['regional-special'])).toEqual(['regional-special']);
  });

  it('associates every profile field with a visible label', () => {
    render(
      <BasicInfoFields
        values={{ name: 'FoodFlow', description: 'Fresh food', address: '1 Main St', phone: '0900000000' }}
        setters={{ setName: vi.fn(), setDescription: vi.fn(), setAddress: vi.fn(), setPhone: vi.fn() }}
        cuisines={[]}
        onToggleCuisine={vi.fn()}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'name' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'description' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'address' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'phone' })).toBeVisible();
  });

  it('exposes the accepting-orders toggle name and pressed state', () => {
    const setIsOpen = vi.fn();
    render(<OperationsFields minOrder="100000" isOpen setMinOrder={vi.fn()} setIsOpen={setIsOpen} />);

    expect(screen.getByRole('spinbutton', { name: 'minOrder' })).toBeVisible();
    const toggle = screen.getByRole('button', { name: 'acceptingOrders' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });
});
