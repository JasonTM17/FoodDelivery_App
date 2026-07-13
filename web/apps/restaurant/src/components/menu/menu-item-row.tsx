'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImageOff, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MenuItem } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

interface MenuItemRowProps {
  item: MenuItem;
  onToggle: (item: MenuItem) => void;
}

export function MenuItemRow({ item, onToggle }: MenuItemRowProps) {
  const t = useTranslations('menu.row');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3',
        'transition-[border-color,box-shadow] duration-200 hover:border-gray-200 hover:shadow-sm motion-reduce:transition-none',
        !item.available && 'opacity-60'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none"
        aria-label={t('dragHandle')}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {item.image ? (
          <div
            role="img"
            aria-label={item.name}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${JSON.stringify(item.image)})` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="h-4 w-4 text-gray-300" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate text-sm">{item.name}</p>
        <p className="truncate text-xs text-gray-600">
          {item.description || t('noDescription')}
        </p>
      </div>

      <span className="text-sm font-semibold text-brand-600 shrink-0">
        {formatCurrency(item.price)}
      </span>

      <button
        onClick={() => onToggle(item)}
        className={cn(
          'flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 border transition-colors shrink-0',
          item.available
            ? 'border-green-300 text-green-700 hover:bg-green-50'
            : 'border-red-200 text-red-600 hover:bg-red-50'
        )}
        title={item.available ? t('availableTitle') : t('unavailableTitle')}
      >
        {item.available ? (
          <><ToggleRight className="h-4 w-4" /><span className="hidden sm:inline">{t('available')}</span></>
        ) : (
          <><ToggleLeft className="h-4 w-4" /><span className="hidden sm:inline">{t('unavailable')}</span></>
        )}
      </button>
    </div>
  );
}
