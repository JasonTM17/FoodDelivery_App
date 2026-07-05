import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MenuItemEditor } from '@/components/restaurant/menu/menu-item-editor';
import { api } from '@/lib/api';

const pushMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('@/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, string> = {
      'menu.board.retry': 'Retry',
      'menu.editPage.title': 'Edit item',
      'menu.editPage.description': 'Update menu item information',
      'menu.editPage.back': 'Back to menu',
      'menu.editPage.loadError': 'Could not load the item',
      'menu.editPage.saveError': 'Could not save. Please try again.',
      'menu.editPage.categoryPlaceholder': 'E.g. Main dishes',
      'menu.editPage.cancel': 'Cancel',
      'menu.editPage.save': 'Save changes',
      'menu.form.name': 'Item name',
      'menu.form.description': 'Description',
      'menu.form.price': 'Price',
      'menu.form.category': 'Category',
      'menu.form.saving': 'Saving...',
      'menu.form.errors.nameRequired': 'Name is required',
      'menu.form.errors.priceInvalid': 'Price must be greater than zero',
    };
    return messages[`${namespace}.${key}`] ?? key;
  },
}));

vi.mock('@/components/menu/menu-item-options-builder', () => ({
  MenuItemOptionsBuilder: () => <div data-testid="options-builder" />,
}));

vi.mock('@/components/menu/menu-item-photo-upload', () => ({
  MenuItemPhotoUpload: () => <div data-testid="photo-upload" />,
}));

vi.mock('@/components/menu/menu-item-availability-toggle', () => ({
  MenuItemAvailabilityToggle: () => <div data-testid="availability-toggle" />,
}));

vi.mock('@/components/restaurant/menu/menu-item-allergen-picker', () => ({
  MenuItemAllergenPicker: () => <div data-testid="allergen-picker" />,
}));

describe('MenuItemEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a retryable load error instead of a blank editable form', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('network down'));

    render(<MenuItemEditor id="item-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
    expect(screen.queryByText('Item name')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('renders the edit form only after retrying with real item data', async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(makeMenuItem());

    render(<MenuItemEditor id="item-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByDisplayValue('Phở bò thật')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });
});

function makeMenuItem() {
  return {
    id: 'item-1',
    name: 'Phở bò thật',
    description: 'Dữ liệu món ăn trả về từ API',
    price: 75_000,
    category: 'Main dishes',
    image: '',
    available: true,
    allergens: [],
    options: [],
  };
}
