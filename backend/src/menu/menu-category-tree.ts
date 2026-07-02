export interface MenuCategoryRecord {
  id: string
  name: string
  icon: string | null
  parentId: string | null
  sortOrder: number
  isVisible: boolean
}

export interface MenuCategoryNode {
  id: string
  name: string
  icon: string
  parentId?: string
  sortOrder: number
  itemCount: number
  isVisible: boolean
  children: MenuCategoryNode[]
}

export function toMenuCategoryNode(
  category: MenuCategoryRecord,
  itemCount = 0,
): MenuCategoryNode {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon ?? '',
    ...(category.parentId ? { parentId: category.parentId } : {}),
    sortOrder: category.sortOrder,
    itemCount,
    isVisible: category.isVisible,
    children: [],
  }
}

export function buildMenuCategoryTree(
  categories: Array<MenuCategoryRecord & { _count: { menuItems: number } }>,
): MenuCategoryNode[] {
  const nodes = new Map(categories.map(category => [
    category.id,
    toMenuCategoryNode(category, category._count.menuItems),
  ]))
  const roots: MenuCategoryNode[] = []

  for (const category of categories) {
    const node = nodes.get(category.id)!
    const parent = category.parentId ? nodes.get(category.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  return roots
}
