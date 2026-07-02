import type { MenuItemOption } from '@/lib/types';

export type MenuItemFormErrorKey =
  | 'nameRequired'
  | 'nameTooShort'
  | 'nameTooLong'
  | 'descriptionTooLong'
  | 'priceInvalid'
  | 'categoryRequired'
  | 'imageInvalid'
  | 'optionsLimit'
  | 'optionNameRequired'
  | 'optionChoiceRequired'
  | 'choicesLimit'
  | 'choiceNameRequired'
  | 'choicePriceInvalid';

interface MenuItemFormValidationInput {
  name: string;
  description: string;
  price: string;
  category: string;
  customCategory: string;
  useCustomCategory: boolean;
  image: string;
  options: MenuItemOption[];
}

export function getMenuItemFormError({
  name,
  description,
  price,
  category,
  customCategory,
  useCustomCategory,
  image,
  options,
}: MenuItemFormValidationInput): MenuItemFormErrorKey | null {
  const normalizedName = name.trim();
  if (!normalizedName) return 'nameRequired';
  if (normalizedName.length < 2) return 'nameTooShort';
  if (normalizedName.length > 100) return 'nameTooLong';
  if (description.trim().length > 500) return 'descriptionTooLong';

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return 'priceInvalid';

  const selectedCategory = useCustomCategory ? customCategory.trim() : category.trim();
  if (!selectedCategory) return 'categoryRequired';
  if (image.trim() && !isHttpUrl(image.trim())) return 'imageInvalid';
  if (options.length > 5) return 'optionsLimit';

  for (const option of options) {
    if (!option.name.trim()) return 'optionNameRequired';
    if (option.choices.length === 0) return 'optionChoiceRequired';
    if (option.choices.length > 10) return 'choicesLimit';
    for (const choice of option.choices) {
      if (!choice.name.trim()) return 'choiceNameRequired';
      if (!Number.isFinite(choice.price) || choice.price < 0) return 'choicePriceInvalid';
    }
  }

  return null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const supportedProtocol = url.protocol === 'http:' || url.protocol === 'https:';
    return supportedProtocol && !url.username && !url.password;
  } catch {
    return false;
  }
}
