import { describe, expect, it } from 'vitest';
import { getMenuItemFormError } from '@/components/menu/menu-item-form-validation';

const validInput = {
  name: 'Rare beef pho',
  description: 'A balanced bowl of pho.',
  price: '65000',
  category: 'Main dishes',
  customCategory: '',
  useCustomCategory: false,
  image: 'https://images.example.com/pho.jpg',
  options: [],
};

describe('getMenuItemFormError', () => {
  it('accepts a valid menu item draft', () => {
    expect(getMenuItemFormError(validInput)).toBeNull();
  });

  it('requires the active custom category instead of a stale selected category', () => {
    expect(getMenuItemFormError({
      ...validInput,
      customCategory: '   ',
      useCustomCategory: true,
    })).toBe('categoryRequired');
  });

  it('rejects non-http image schemes', () => {
    expect(getMenuItemFormError({ ...validInput, image: 'javascript:alert(1)' }))
      .toBe('imageInvalid');
    expect(getMenuItemFormError({ ...validInput, image: 'https://user:secret@images.example.com/pho.jpg' }))
      .toBe('imageInvalid');
  });

  it('requires complete option groups and choices', () => {
    expect(getMenuItemFormError({
      ...validInput,
      options: [{ id: 'size', name: 'Size', type: 'single', required: true, choices: [] }],
    })).toBe('optionChoiceRequired');

    expect(getMenuItemFormError({
      ...validInput,
      options: [{
        id: 'size',
        name: 'Size',
        type: 'single',
        required: true,
        choices: [{ id: 'large', name: '', price: 10_000 }],
      }],
    })).toBe('choiceNameRequired');
  });

  it('rejects non-finite prices and negative option surcharges', () => {
    expect(getMenuItemFormError({ ...validInput, price: 'Infinity' })).toBe('priceInvalid');
    expect(getMenuItemFormError({
      ...validInput,
      options: [{
        id: 'size',
        name: 'Size',
        type: 'single',
        required: true,
        choices: [{ id: 'large', name: 'Large', price: -1 }],
      }],
    })).toBe('choicePriceInvalid');
  });
});
