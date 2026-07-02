import { buildMenuCategoryTree, toMenuCategoryNode } from './menu-category-tree'

describe('menu category API serialization', () => {
  it('builds the hierarchy and exposes item counts expected by the web app', () => {
    const tree = buildMenuCategoryTree([
      makeCategory({ id: 'root', name: 'Main', itemCount: 3 }),
      makeCategory({ id: 'child', name: 'Rice', parentId: 'root', itemCount: 2 }),
    ])

    expect(tree).toEqual([
      expect.objectContaining({
        id: 'root',
        itemCount: 3,
        children: [expect.objectContaining({ id: 'child', itemCount: 2 })],
      }),
    ])
  })

  it('keeps orphaned categories visible as roots instead of dropping data', () => {
    const tree = buildMenuCategoryTree([
      makeCategory({ id: 'orphan', parentId: 'missing' }),
    ])

    expect(tree).toHaveLength(1)
    expect(tree[0]?.id).toBe('orphan')
  })

  it('normalizes nullable fields for create and update responses', () => {
    expect(toMenuCategoryNode(makeCategory({ icon: null, parentId: null }))).toMatchObject({
      icon: '',
      itemCount: 0,
      children: [],
    })
  })
})

function makeCategory(overrides: {
  id?: string
  name?: string
  icon?: string | null
  parentId?: string | null
  itemCount?: number
} = {}) {
  const { itemCount = 0, ...categoryOverrides } = overrides
  return {
    id: 'category-1',
    name: 'Category',
    icon: null,
    parentId: null,
    sortOrder: 0,
    isVisible: true,
    _count: { menuItems: itemCount },
    ...categoryOverrides,
  }
}
