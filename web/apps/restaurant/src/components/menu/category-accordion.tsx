'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, UtensilsCrossed } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useTranslations } from 'next-intl';
import type { MenuItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MenuItemRow } from './menu-item-row';

interface CategoryAccordionProps {
  category: string;
  items: MenuItem[];
  onToggle: (item: MenuItem) => void;
  onReorder: (category: string, items: MenuItem[]) => void;
  defaultOpen?: boolean;
}

export function CategoryAccordion({
  category,
  items,
  onToggle,
  onReorder,
  defaultOpen = true,
}: CategoryAccordionProps) {
  const t = useTranslations('menu.categoryAccordion');
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      onReorder(category, arrayMove(items, oldIdx, newIdx));
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-brand-500 shrink-0" />
          <span className="font-semibold text-gray-900">{category}</span>
          <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
            {t('itemCount', { count: items.length })}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className={cn('p-3 space-y-2', items.length === 0 && 'pb-4')}>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">
              {t('empty')}
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <MenuItemRow key={item.id} item={item} onToggle={onToggle} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}
