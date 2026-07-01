'use client';

import { useState } from 'react';
import type { MenuCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, GripVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

interface CategoryTreeProps {
  categories: MenuCategory[];
  onToggleVisibility?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: (parentId?: string) => void;
}

export function CategoryTree({ categories, onToggleVisibility, onEdit, onDelete, onAdd }: CategoryTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  return (
    <div className="space-y-1" data-testid="category-tree">
      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 group">
            <button type="button" onClick={() => toggleExpand(cat.id)} className="p-0.5">
              {cat.children && cat.children.length > 0 ? (
                expanded.has(cat.id) ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />
              ) : (
                <div className="w-4" />
              )}
            </button>
            <GripVertical className="h-4 w-4 text-gray-300" />
            <span className="text-lg">{cat.icon || '📁'}</span>
            <span className="flex-1 text-sm text-gray-900">{cat.name}</span>
            <span className="text-xs text-gray-400">{cat.itemCount} món</span>
            <div className="hidden group-hover:flex items-center gap-1">
              <button type="button" onClick={() => onToggleVisibility?.(cat.id)} className="btn-ghost p-1" title={cat.isVisible ? 'Ẩn' : 'Hiện'}>
                {cat.isVisible ? <Eye className="h-3.5 w-3.5 text-gray-400" /> : <EyeOff className="h-3.5 w-3.5 text-gray-400" />}
              </button>
              <button type="button" onClick={() => onEdit?.(cat.id)} className="btn-ghost p-1">
                <Pencil className="h-3.5 w-3.5 text-gray-400" />
              </button>
              <button type="button" onClick={() => onDelete?.(cat.id)} className="btn-ghost p-1">
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </button>
            </div>
          </div>

          {/* Children */}
          {cat.children && expanded.has(cat.id) && (
            <div className="ml-8 space-y-1 border-l-2 border-gray-100 pl-4">
              {cat.children.map((child) => (
                <div key={child.id} className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-50 group">
                  <span className="text-lg">{child.icon || '📌'}</span>
                  <span className="flex-1 text-sm text-gray-700">{child.name}</span>
                  <span className="text-xs text-gray-400">{child.itemCount} món</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {onAdd && (
        <button
          type="button"
          onClick={() => onAdd()}
          className="w-full rounded-lg border-2 border-dashed border-gray-200 py-2 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
        >
          + Thêm danh mục
        </button>
      )}
    </div>
  );
}
