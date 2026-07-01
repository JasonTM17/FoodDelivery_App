export interface MenuItemOptionFormValues {
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  choices: { label: string; priceDelta: number }[];
}

export interface MenuItemFormValues {
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  image?: string;
  isAvailable: boolean;
  options: MenuItemOptionFormValues[];
}

interface ValidationResult { valid: boolean; errors: string[] }

export function validateMenuItem(data: unknown): ValidationResult {
  const errors: string[] = [];
  const obj = data as Record<string, unknown>;

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Dữ liệu không hợp lệ'] };
  }

  if (typeof obj.name !== 'string' || obj.name.trim().length < 2) {
    errors.push('Tên phải có ít nhất 2 ký tự');
  }
  if (typeof obj.name === 'string' && obj.name.trim().length > 100) {
    errors.push('Tên tối đa 100 ký tự');
  }

  if (typeof obj.description === 'string' && obj.description.length > 500) {
    errors.push('Mô tả tối đa 500 ký tự');
  }

  if (typeof obj.categoryId !== 'string' || obj.categoryId.trim().length === 0) {
    errors.push('Vui lòng chọn danh mục');
  }

  if (typeof obj.basePrice !== 'number' || obj.basePrice <= 0) {
    errors.push('Giá phải lớn hơn 0');
  }

  if (Array.isArray(obj.options) && obj.options.length > 5) {
    errors.push('Tối đa 5 tùy chọn');
  }

  return { valid: errors.length === 0, errors };
}

export function validateOption(data: unknown): ValidationResult {
  const errors: string[] = [];
  const obj = data as Record<string, unknown>;

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Dữ liệu không hợp lệ'] };
  }

  if (typeof obj.name !== 'string' || obj.name.trim().length === 0) {
    errors.push('Tên tuỳ chọn không được để trống');
  }

  if (!Array.isArray(obj.choices) || obj.choices.length === 0) {
    errors.push('Phải có ít nhất 1 lựa chọn');
  } else if (obj.choices.length > 10) {
    errors.push('Tối đa 10 lựa chọn');
  }

  return { valid: errors.length === 0, errors };
}
