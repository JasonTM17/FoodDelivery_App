import { buildPromotionCartContext } from './build-promotion-cart-context'

describe('buildPromotionCartContext', () => {
  it('includes delivery fee, unique menu item ids, and category ids from menu items', () => {
    const context = buildPromotionCartContext({
      subtotal: 120_000,
      restaurantId: 'rest-1',
      deliveryFee: 15_000,
      items: [
        { menuItemId: 'mi-1', menuItem: { categoryId: 'cat-a' } },
        { menuItemId: 'mi-2', menuItem: { categoryId: 'cat-a' } },
        { menuItemId: 'mi-1', menuItem: { categoryId: 'cat-a' } },
        { menuItemId: 'mi-3', menuItem: { categoryId: 'cat-b' } },
      ],
    })

    expect(context).toEqual({
      subtotal: 120_000,
      restaurantId: 'rest-1',
      deliveryFee: 15_000,
      menuItemIds: ['mi-1', 'mi-2', 'mi-3'],
      categoryIds: ['cat-a', 'cat-b'],
    })
  })

  it('falls back to line-level categoryId when menuItem relation is absent', () => {
    const context = buildPromotionCartContext({
      subtotal: 50_000,
      restaurantId: 'rest-2',
      deliveryFee: 20_000,
      items: [{ menuItemId: 'mi-9', categoryId: 'cat-fallback' }],
    })

    expect(context.categoryIds).toEqual(['cat-fallback'])
    expect(context.menuItemIds).toEqual(['mi-9'])
  })
})
