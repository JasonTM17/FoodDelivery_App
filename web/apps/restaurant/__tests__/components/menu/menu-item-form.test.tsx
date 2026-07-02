import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MenuItemForm } from '@/components/menu/menu-item-form';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, string> = {
      'menu.form.formAria': 'Menu item details form',
      'menu.form.name': 'Item name',
      'menu.form.description': 'Description',
      'menu.form.price': 'Price',
      'menu.form.category': 'Category',
      'menu.form.selectCategory': 'Select category',
      'menu.form.addCategory': 'Add custom category',
      'menu.form.customCategoryPlaceholder': 'Enter a new category',
      'menu.form.imageUrl': 'Image URL',
      'menu.form.update': 'Update',
      'menu.form.errors.categoryRequired': 'Please choose a category',
      'menu.form.options.title': 'Item options',
      'menu.form.options.addOption': 'Add option',
    };
    return messages[`${namespace}.${key}`] ?? key;
  },
}));

describe('MenuItemForm', () => {
  it('validates the active custom category instead of submitting a stale selection', () => {
    const onSubmit = vi.fn();
    render(
      <MenuItemForm
        initialData={{ name: 'Pho', price: 65_000, category: 'Main dishes' }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add custom category' }));
    fireEvent.submit(screen.getByRole('form', { name: 'Menu item details form' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please choose a category');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
